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
                        return;
                    }
                    let result = false;
                    if (res.statusCode === 200 && options.isActive ||
                        res.statusCode !== 200 && !options.isActive) {
                        return;
                    } else if (res.statusCode === 200) {
                        result = true;
                        console.log(options.url + " is ok");
                        sns.publish({
                            Message: options.url + ' が復活しました。',
                            Subject: 'error notification',
                            TopicArn: data.topicArn
                        }, (err, data) => {
                            console.log(err);
                        });
                    } else {
                        console.log(options.url + " is error");
                        sns.publish({
                            Message: options.url + ' からの応答がありません。',
                            Subject: 'error notification',
                            TopicArn: data.topicArn
                        }, (err, data) => {
                            console.log(err);
                        });
                    }
                    isUpdate = true;
                    urlList[index].options.isActive = result;
                    resolve(result);
                }).on('error', (err) => {
                    console.log(err)
                    resolve(err);
                    return;
                })
            })
            reqs.push(req);
        });
        Promise.all(reqs).then(() => {
            if (urlList == null && !isUpdate) {
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