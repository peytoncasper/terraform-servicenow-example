provider "aws" {
    region = "us-west-2"
}

# provider "azurerm" {}

module "aws_instance" {
    source  = "app.terraform.io/service-now-test/module-example/aws"
    version = "1.0.0"
    instance_type = "t2.medium"
}