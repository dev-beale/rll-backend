import AWS from "aws-sdk";
import fs from 'fs';
  
export function uploadToS3(file : string,){
    const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
    
    var fileStream = fs.createReadStream(file);
    fileStream.on("error", function (err: any) {
        console.log("File Error", err);
    });
    var uploadParams = { Bucket: "gurneysbucket", Key: "", Body : fileStream };
    var path = require("path");
    uploadParams.Key = path.basename(file);

    // call S3 to retrieve upload file to specified bucket
    s3.upload(uploadParams, function (err: any, data: { Location: any; }) {
        if (err) {
            console.log("Error", err);
        }
        if (data) {
            console.log("Upload Success", data.Location);
            const transcribeService = new AWS.TranscribeService({apiVersion : '2017-10-26'})

            var params = {
                Media: { /* required */
                  MediaFileUri: data.Location,
                },
                TranscriptionJobName: `rll-transcription-${Date.now().toString()}`, /* required */
                IdentifyLanguage: true,
                IdentifyMultipleLanguages: true,
                MediaFormat: "mp3",
                OutputBucketName: 'gurneysbucket',
                OutputKey: 'rll-transcription',
              };

            transcribeService.startTranscriptionJob(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                } // an error occurred
                else {
                    console.log(data);
                }           // successful response
            });
        }
    });
}