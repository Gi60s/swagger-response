# swagger-response

Working with the [swagger package](https://www.npmjs.com/package/swagger), this package provides a module that assists in constructing responses. [Swagger](https://www.npmjs.com/package/swagger) verifies that the response object matches the definition file when you try to send the response.

This module takes the validation a step further through the following features:

1. Automatic population of default property values.
2. Validation occurs for each value set.

## Installation

```sh
$ npm install swagger-response
```

## Usage

```json
{
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Swagger Petstore",
    "license": {
      "name": "MIT"
    }
  },
  "host": "petstore.swagger.io",
  "basePath": "/v1",
  "schemes": [
    "http"
  ],
  "consumes": [
    "application/json"
  ],
  "produces": [
    "application/json"
  ],
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "operationId": "listPets",
        "responses": {
          "200": {
            "description": "An paged array of pets",
            "headers": {
              "x-next": {
                "type": "string",
                "description": "A link to the next page of responses"
              }
            },
            "schema": {
              "$ref": "#/definitions/Pets"
            }
          },
          "default": {
            "description": "unexpected error",
            "schema": {
              "$ref": "#/definitions/Error"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "Pet": {
      "required": [
        "id",
        "name"
      ],
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "name": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        }
      }
    },
    "Pets": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Pet"
      }
    },
    "Error": {
      "required": [
        "code",
        "message"
      ],
      "properties": {
        "code": {
          "type": "integer",
          "format": "int32"
        },
        "message": {
          "type": "string"
        }
      }
    }
  }
}
```

```js
exports.myOperationId = function(req, res) {
    const response = Response(req, 200);

    addresses.createAddress(params.personId, params.addressLine1, params.addressLine2, params.city, params.state, params.zipcode);

    response.values = addresses.getAddresses(params.personId);

    res.json(response);
};
```