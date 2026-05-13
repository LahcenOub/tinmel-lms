import { db } from './db.js';
import mqtt from 'mqtt';

class LoRaWANManager {
    constructor() {
        this.mqttClients = {}; // key: schoolId or mqttUrl
        this.configs = [];
    }

    async init() {
        // Load configs from DB
        const row = await db.get("SELECT value FROM settings WHERE key = 'lorawan_configs'");
        if (row && row.value) {
            try {
                this.configs = JSON.parse(row.value);
                this.startClients();
            } catch (e) {
                console.error("Failed to parse lorawan_configs:", e);
            }
        }
    }

    async saveConfigs(configs) {
        this.configs = configs;
        await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('lorawan_configs', ?)", [JSON.stringify(configs)]);
        this.startClients();
    }

    startClients() {
        // Disconnect existing clients
        Object.values(this.mqttClients).forEach(client => client.end(true));
        this.mqttClients = {};

        // Start new clients for EXTERNAL_NS
        this.configs.forEach(conf => {
            if (conf.scenario === 'EXTERNAL_NS' && conf.mqttUrl) {
                console.log(`Starting MQTT client for ${conf.mqttUrl}`);
                const opts = {};
                if (conf.mqttUsername) opts.username = conf.mqttUsername;
                if (conf.mqttPassword) opts.password = conf.mqttPassword;

                const client = mqtt.connect(conf.mqttUrl, opts);
                this.mqttClients[conf.schoolId] = client;

                client.on('connect', () => {
                    console.log(`✅ LoRaWAN MQTT Connected: ${conf.mqttUrl}`);
                    client.subscribe('#', (err) => {
                        if(err) console.error("MQTT Subscribe error:", err);
                    });
                });

                client.on('message', (topic, message) => {
                    this.processUplink(conf.schoolId, message.toString());
                });

                client.on('error', (err) => {
                    console.error(`❌ MQTT Error on ${conf.mqttUrl}:`, err.message);
                });
            }
        });
    }

    // Process uplink (from MQTT or from HTTP webhook)
    async processUplink(schoolId, payloadStr) {
        console.log(`📡 Recu uplink LoRaWAN pour school ${schoolId} (payload received)`);
        try {
            const data = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
            const conf = this.configs.find(c => c.schoolId === schoolId);
            
            let decodedPayload = await this.tryDecodeCustom(data, conf) ?? this.extractDefaultPayload(data);

            if (decodedPayload?.quizId && decodedPayload?.studentId) {
                 await this.saveQuizResult(decodedPayload);
            } else {
                 console.log("⚠️ Le payload ignoré: manquant quizId ou studentId");
            }
        } catch (e) {
            console.error("Error processing LoRaWAN uplink:", e);
        }
    }

    async tryDecodeCustom(data, conf) {
        if (!conf?.decoderScript) return null;
        try {
            const rawPayloadBytes = this.extractRawBytes(data);
            if (rawPayloadBytes.length > 0) {
                const vm = await import('node:vm');
                const script = new vm.Script(`
                    ${conf.decoderScript}
                    result = decode(bytes);
                `);
                const context = { bytes: rawPayloadBytes, result: null, console: console };
                script.runInNewContext(context);
                console.log("🔓 Payload décodé via script custom");
                return context.result;
            }
        } catch (e) {
            console.error("❌ Erreur pendant l'exécution du script de décodage:", e);
        }
        return null;
    }

    extractRawBytes(data) {
        if (data?.uplink_message?.frm_payload) { // TTN
            return Array.from(Buffer.from(data.uplink_message.frm_payload, 'base64'));
        }
        if (data?.data) { // ChirpStack
            return Array.from(Buffer.from(data.data, 'base64'));
        }
        if (data?.payload) { // Generic
            return Array.isArray(data.payload) ? data.payload : Array.from(Buffer.from(data.payload, 'base64'));
        }
        if (Array.isArray(data)) {
            return data;
        }
        return [];
    }

    extractDefaultPayload(data) {
        return data?.uplink_message?.decoded_payload ?? data?.object ?? data;
    }

    async saveQuizResult(decoded) {
        // Enregistrer automatiquement le resultat du quiz recu via radio
        // decoded doit contenir { quizId, studentId, answers: [{...}], score: x }
        const resultId = `res-lora-${Date.now()}`;
        const finalScore = decoded.score || 0;
        const resultData = {
            id: resultId,
            quizId: decoded.quizId,
            studentId: decoded.studentId,
            studentName: decoded.studentName || 'Etudiant (LoRaWAN)',
            answers: decoded.answers || [],
            score: finalScore,
            maxScore: decoded.maxScore || 0,
            submittedAt: new Date().toISOString(),
            via: 'lorawan'
        };

        try {
            await db.run(
                `INSERT INTO results (id, quizId, studentId, score, submittedAt, data) VALUES (?, ?, ?, ?, ?, ?)`,
                [resultId, decoded.quizId, decoded.studentId, finalScore, resultData.submittedAt, JSON.stringify(resultData)]
            );
            console.log(`✅ [LoRaWAN] Resultat sauvegardé pour quizId=${decoded.quizId} studentId=${decoded.studentId}`);
        } catch (e) {
            console.error("❌ [LoRaWAN] Save result error:", e);
        }
    }

    // INTERNAL_NS validation
    isValidGateway(gatewayEui) {
        const found = this.configs.find(c => c.scenario === 'INTERNAL_NS' && c.gatewayEui === gatewayEui);
        return found ? found.schoolId : null;
    }
}

export const loraManager = new LoRaWANManager();
