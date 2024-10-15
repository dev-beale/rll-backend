import { getOpenAPIKey } from "./aws-ssm";
import axios, { AxiosResponse } from "axios";

export async function postToOpenAI(message : string) {
    
    const postData = {
        "model": "gpt-4",
        "messages": [{"role": "user", "content": message}]
    }
    try {
        const response : AxiosResponse = await axios({
            method: 'post',
            url: 'https://api.openai.com/v1/chat/completions',
            data: postData,
            headers : {
                'Authorization' : 'Bearer ' + await getOpenAPIKey(),
                'Content-Type' : 'application/json'
            },
        });

        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
}