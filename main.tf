provider "aws" {
    region = "us-west-2"
}

# provider "azurerm" {}

module "aws_instance" {
    source  = "app.terraform.io/service-now-test/module-example/aws"
    version = "1.0.0"
    instance_type = "t2.medium"

    num = var.cloud == "aws" ? 1 : 0
}

module "azure_instance" {
    source  = "app.terraform.io/service-now-test/module-example/azure"
    version = "1.0.0"
    instance_type = "Standard_DS1_v2"

    num = var.cloud == "azure" ? 1 : 0
}