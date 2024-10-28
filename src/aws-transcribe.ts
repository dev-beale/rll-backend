import { TranscribeClient, StartTranscriptionJobCommand, StartTranscriptionJobRequest, MediaFormat, StartTranscriptionJobCommandOutput } from "@aws-sdk/client-transcribe";
import { TranscriptionJobResult } from "./interfaces";

export async function submitTranscriptionJob(dataLocation : string) : Promise<TranscriptionJobResult>{
    const client = new TranscribeClient({ region: "us-east-1" });    
    
    const currentTime = Date.now().toString();

    const bucketName : string = "gurneysbucket";
    const key = `rll-transcription-output-${currentTime}`;

    var params : StartTranscriptionJobRequest = {
        Media: { 
            MediaFileUri: dataLocation,
        },
        TranscriptionJobName: `rll-transcription-job-${currentTime}`,
        IdentifyLanguage: true,
        IdentifyMultipleLanguages: true,
        MediaFormat: MediaFormat.OGG,
        OutputBucketName: bucketName,
        OutputKey: key,
    };
    const startTranscriptionJobCommand : StartTranscriptionJobCommand = new StartTranscriptionJobCommand(params);

    const transcriptionJobResult : TranscriptionJobResult = {
        success: false,
        dataLocation: ""
    }

    try {
        const startTranscriptionJobCommandOutput : StartTranscriptionJobCommandOutput = await client.send(startTranscriptionJobCommand);
        transcriptionJobResult.success = true;
        transcriptionJobResult.dataLocation = 'somewhere';
        transcriptionJobResult.bucket = bucketName;
        transcriptionJobResult.key = key;
        transcriptionJobResult.startTranscriptionJobCommandOutput = startTranscriptionJobCommandOutput;
    } catch (error) {
        transcriptionJobResult.success = false;
    }

    return transcriptionJobResult;
}