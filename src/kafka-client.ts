import { Kafka } from 'kafkajs';

export const kafkaClient = new Kafka({
    clientId: 'chaicode',
    brokers: ['kafka:9092'],
});
