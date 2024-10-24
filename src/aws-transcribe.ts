import AWS from "aws-sdk";
  
export function submitTranscriptionJob(dataLocation : string, mediaFormat : string){
    const transcribeService = new AWS.TranscribeService({apiVersion : '2017-10-26'})

    const currentTime = Date.now().toString();

    var params = {
        Media: { 
            MediaFileUri: dataLocation,
        },
        TranscriptionJobName: `rll-transcription-job-${currentTime}`,
        IdentifyLanguage: true,
        IdentifyMultipleLanguages: true,
        MediaFormat: mediaFormat,//"mp3 | mp4 | wav | flac | ogg | amr | webm | m4a",
        OutputBucketName: 'gurneysbucket',
        OutputKey: `rll-transcription-output-${currentTime}`,
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