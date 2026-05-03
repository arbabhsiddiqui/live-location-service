import { kafkaClient } from './kafka-client.js';

async function init() {
    const kafkaConsumer = kafkaClient.consumer({
        groupId: `database-processor`,
    });
    await kafkaConsumer.connect();

    await kafkaConsumer.subscribe({
        topics: ['location-updates'],
        fromBeginning: true,
    });

    kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
            // 1. Guard clause to handle null or empty values
            if (!message.value) {
                console.warn(`Skipping empty message in ${topic}`);
                return;
            }

            // 2. TypeScript now knows message.value is safe to use
            try {
                const data = JSON.parse(message.value.toString());
                console.log(`INSERT INTO DB LOCATION`, data);
            } catch (err) {
                console.error("Failed to parse JSON payload", err);
            }

            await heartbeat();
        },
    });
}

init();
