# Amazon Lambda で Web監視するスクリプト

## 使い方

1. モジュールのダウンロード

```bash
npm install
```

2. ZIPで固める

* node_modules
* index.js

の二つをZIPで固める

3. AWS Lambda にアップする

https://us-west-2.console.aws.amazon.com/lambda/

4. 環境変数を設定する

* bucketName:your_bucket
* itemKey:setting_file_name.json

5. 適当なトリガーを設定する

以上