
def lambda_handler(event, context):

    data = event

    return {
        'statusCode': 200,
        'body': data
    }