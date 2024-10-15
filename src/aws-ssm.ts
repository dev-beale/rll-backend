 import AWS from 'aws-sdk';

// Set the region
AWS.config.update({ region: 'us-east-1' });

// Create an SSM client
const ssm = new AWS.SSM();

export async function getOpenAPIKey() {

    const params = {
        Name: 'rll-openai-key', // Replace with your parameter name
        WithDecryption: true // Set to true if the parameter is encrypted
    };

    try {
        const data = await ssm.getParameter(params).promise();
        console.log('Parameter value:', data.Parameter?.Value);
        return data.Parameter?.Value;
    } catch (error) {
        console.error('Error getting parameter:', error);
        throw error;
    }
    
}

exports.getOpenAPIKey = getOpenAPIKey;