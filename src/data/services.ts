import s3Icon from "../assets/aws-icons/s3.png";
import cloudfrontIcon from "../assets/aws-icons/cloudfront.png";
import apiGatewayIcon from "../assets/aws-icons/apigateway.png";
import lambdaIcon from "../assets/aws-icons/lambda.png";
import dynamodbIcon from "../assets/aws-icons/dynamodb.png";
import ec2Icon from "../assets/aws-icons/ec2.png";
import albIcon from "../assets/aws-icons/alb.png";
import rdsIcon from "../assets/aws-icons/rds.png";

export interface AwsServiceItem {
  id: string;
  label: string;
  icon: string;
}

export const awsServices: AwsServiceItem[] = [
  { id: "s3", label: "S3", icon: s3Icon },
  { id: "cloudfront", label: "CloudFront", icon: cloudfrontIcon },
  { id: "apigateway", label: "API Gateway", icon: apiGatewayIcon },
  { id: "lambda", label: "Lambda", icon: lambdaIcon },
  { id: "dynamodb", label: "DynamoDB", icon: dynamodbIcon },
  { id: "ec2", label: "EC2", icon: ec2Icon },
  { id: "alb", label: "ALB", icon: albIcon },
  { id: "rds", label: "RDS", icon: rdsIcon },
];
