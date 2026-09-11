import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({
  node: ELASTICSEARCH_URL,
});

export async function initElasticsearch() {
  try {
    const indexExists = await esClient.indices.exists({ index: 'email-jobs' });
    
    if (!indexExists) {
      console.log('Creating Elasticsearch index: email-jobs');
      await esClient.indices.create({
        index: 'email-jobs',
        mappings: {
          properties: {
            recipientEmail: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            senderEmail: { type: 'keyword' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            userId: { type: 'keyword' }
          }
        }
      });
      console.log('Elasticsearch index created successfully.');
    }
  } catch (error) {
    console.error('Failed to initialize Elasticsearch index. Search may not work:', error);
  }
}
