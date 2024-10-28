import { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { StartTranscriptionJobCommandOutput } from "@aws-sdk/client-transcribe";

export interface S3UploadResult {
    success : boolean,
    dataLocation : string,
    bucket? : string,
    key? : string,
    putObjectCommandOutput? : PutObjectCommandOutput;
}

export interface TranscriptionJobResult {
    success : boolean,
    dataLocation : string,
    bucket? : string,
    key? : string,
    startTranscriptionJobCommandOutput? : StartTranscriptionJobCommandOutput;
}