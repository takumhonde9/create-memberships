# Job

This is a sample lambda function that is used to illustrate how to set up
a job handler (with queues) using a lambda function.

## Technologies
- NestJS
- Docker
- AWS Lambda
- Serverless (SLS)
- Jest
- SendGrid
- Twilio

## Requirements

- NodeJS 18
- Yarn
- Docker
- [Serverless](https://www.serverless.com/framework/docs/getting-started)

## Setup
1. Install serverless

    ```
    npm install -g serverless
    ```

2. Start by installing dependencies:

   ```shell
    yarn install --frozen-lockfile

3. Create a directory `test_data` to store your SQS events for testing purposes.

    ```shell
    mkdir test_data
    ```


## Local testing

Since this is a lambda function, you must run the application without
relying on the `nest start` command. We will rely on serverless to
invoke our function.

### Running function (w/o Docker)

We can run the following command to test the function

```shell
yarn run:function job --path test_data/<file_name>.json
```

## Additional Information

### Commits

Husky will check our messages using a pre-commit hook. This will enable us to have consistent message
styles that we can always refer back to with ease.

We will be using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) specified by the
[Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#type).
As such, we must prefix our commits with the following accepted subjects, anything else will result in an
error:

- `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- `docs`: Documentation only changes
- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `test`: Adding missing tests or correcting existing tests

The format for our commits will follow: `[subject]: message`. Examples are shown below:

- `git commit -m "test: add test for useCounter"` ✅
- `git commit -m "test(useCounter): add test for hook"` ✅
- `git commit -m "add test for useCounter context"` ❌

# SQS Event

Below is an example of a SQS event object that can be used for local testing.

```json
{
    "Records": [
        {
            "messageId": "MessageID_1",
            "receiptHandle": "MessageReceiptHandle",
            "body": "{}",
            "md5OfBody": "fce0ea8dd236ccb3ed9b37dae260836f",
            "md5OfMessageAttributes": "582c92c5c5b6ac403040a4f3ab3115c9",
            "eventSourceARN": "arn:aws:sqs:us-west-2:123456789012:SQSQueue",
            "eventSource": "aws:sqs",
            "awsRegion": "us-west-2",
            "attributes": {
                "ApproximateReceiveCount": "2",
                "SentTimestamp": "1520621625029",
                "SenderId": "AROAIWPX5BD2BHG722MW4:sender",
                "ApproximateFirstReceiveTimestamp": "1520621634884"
            },
            "messageAttributes": {
                "Attribute3": {
                    "binaryValue": "MTEwMA==",
                    "stringListValues": [
                    "abc",
                    "123"
                    ],
                    "binaryListValues": [
                    "MA==",
                    "MQ==",
                    "MA=="
                    ],
                    "dataType": "Binary"
                },
                "Attribute2": {
                    "stringValue": "123",
                    "stringListValues": [],
                    "binaryListValues": [
                    "MQ==",
                    "MA=="
                    ],
                    "dataType": "Number"
                    },
                    "Attribute1": {
                        "stringValue": "AttributeValue1",
                        "stringListValues": [],
                        "binaryListValues": [],
                        "dataType": "String"
                    }
            }
        }
    ]
}
```