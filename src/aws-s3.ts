import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandOutput,
  } from "@aws-sdk/client-s3";
import fs from 'fs';
  
export async function uploadToS3(file : string,) : Promise<PutObjectCommandOutput>{
    const s3Client = new S3Client({region : 'us-east-1'});
    var fileStream = fs.createReadStream(file);
    fileStream.on("error", function (err: any) {
        console.log("File Error", err);
    });

    const currentTime = Date.now().toString();

    const bucketName = "gurneysbucket";
    const key = `user-uploaded-${currentTime}`;

    const s3PutResult : PutObjectCommandOutput = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Body: fileStream,
          Key: key,
        }),
    );

    return s3PutResult;
}