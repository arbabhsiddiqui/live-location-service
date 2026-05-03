import { createServer } from 'node:http'
import { env } from './common/config/env'
import { createExpressApplication } from './modules'

import { Server } from 'socket.io';

import { kafkaClient } from './kafka-client';

async function main() {
    try {
        const server = createServer(createExpressApplication())
        const io = new Server();
        const kafkaProducer = kafkaClient.producer();
        await kafkaProducer.connect();

        const kafkaConsumer = kafkaClient.consumer({
            groupId: `socket-server-${env.PORT}`,
        });
        await kafkaConsumer.connect();

        await kafkaConsumer.subscribe({
            topics: ['location-updates'],
            fromBeginning: true,
        });

        // --- NEW: Socket.io -> Kafka Producer Logic ---
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);

            // Listen for the location event coming FROM the browser
            socket.on('client:location:update', async (data) => {
                try {
                    await kafkaProducer.send({
                        topic: 'location-updates',
                        messages: [
                            {
                                // We include the socket.id so other browsers know who moved
                                value: JSON.stringify({
                                    id: socket.id,
                                    latitude: data.latitude,
                                    longitude: data.longitude
                                })
                            },
                        ],
                    });
                } catch (err) {
                    console.error("Error publishing to Kafka:", err);
                }
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
        // ----------------------------------------------

        kafkaConsumer.run({
            eachMessage: async ({ topic, partition, message, heartbeat }) => {
                // 1. Check if message or message.value is missing
                // message.value is a Buffer | null, so we check specifically for null/undefined
                if (!message?.value) {
                    console.warn(`KafkaConsumer Received Empty Message`, { topic, partition });
                    return;
                }

                try {
                    // 2. At this point, TypeScript knows message.value is NOT null
                    const data = JSON.parse(message.value.toString());

                    console.log(`KafkaConsumer Data Received`, { data });

                    io.emit('server:location:update', {
                        id: data.id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                    });
                } catch (err) {
                    console.error("Failed to parse message payload", err);
                }

                await heartbeat();
            },
        });

        io.attach(server);

        server.listen(env.PORT, () => {
            console.log(`http server is running on PORT ${env.PORT}`)
        })

    } catch (error) {
        console.error(`Error starting server: ${error}`)
        throw error
    }
}


main()