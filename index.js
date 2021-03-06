"use strict"

exports.handler = (event, context, callback) => {
    let AWS = require('aws-sdk');
    let s3 = new AWS.S3();
    let urlList;
    let isUpdate = false;
    const BUCKET_NAME = process.env.bucketName;
    const ITEM_KEY = process.env.itemKey;
    s3.getObject({
        Bucket: BUCKET_NAME,
        Key: ITEM_KEY
    }, function (err, list) {
        if (err) {
            console.log(err);
            //TODO
            return;
        }
        urlList = JSON.parse(list.Body.toString());
        let reqs = [];
        let sns = new AWS.SNS();

        urlList.forEach(function (data, index) {
            let options = data.options;
            let request = require("request");
            let req = new Promise((resolve, reject) => {
                request(options, (err, res, body) => {
                    if (err) {
                        console.log(err)
                        resolve(err);
                    }
                    if (res.statusCode === 200 && data.isActive ||
                        res.statusCode !== 200 && !data.isActive) {
                        console.log(options.url + " is nothig update");
                        resolve(options.url + " is nothing update");
                    } else if (res.statusCode === 200) {
                        console.log(options.url + " is ok");
                        sns.publish({
                            Message: options.url + ' が復活しました。',
                            Subject: 'come back notification',
                            TopicArn: data.topicArn
                        }, (err) => {
                            console.log(err);
                        });
                        isUpdate = true;
                        urlList[index].isActive = true;
                        resolve(options.url + " is ok");    
                    } else {
                        console.log(options.url + " is error");
                        sns.publish({
                            Message: options.url + ' からの応答がありません。',
                            Subject: 'error notification',
                            TopicArn: data.topicArn
                        }, (err) => {
                            console.log(err);
                        });
                        isUpdate = true;
                        urlList[index].isActive = false;
                        resolve(options.url + "is error");    
                    }
                }).on('error', (err) => {
                    console.log(err)
                    resolve(err);
                })
            })
            reqs.push(req);
        });
        Promise.all(reqs).then((messages) => {
            if (urlList == null || !isUpdate) {
                console.log("nothing update");
                return;
            }
            console.log("upload result...");
            s3.upload({
                Bucket: BUCKET_NAME,
                Key: ITEM_KEY,
                Body: JSON.stringify(urlList, null, "    ")
            }, (err) => {
                if (err) {
                    console.log(err);
                }
            })
        })
    })
}