# swagger-response

The [npm swagger package](https://www.npmjs.com/package/swagger) is an awesome tool for turning your swagger definition files into a working API, but one thing it does not do is help you to form the response.

This package provides a tool that makes it easy to build valid swagger responses that match your swagger definitions.

## Installation

```sh
$ npm install swagger-response
```

## Examples

### Basic Example

The following example is trivial, but it does show that the swagger response object is built from the beginning to match the requirements of the swagger response definition.

Using the [Example Swagger Definition File](#example-swagger-definition-file):

**pets.js**

```js
const Response = require('swagger-response');

exports.listPets = function(req, res) {
    const response = Response(req, 200);
    res.json(response);    // returns JSON: []
};
```

### Setting Values Example

Using the [Example Swagger Definition File](#example-swagger-definition-file):

**pets.js**

```js
const Response = require('swagger-response');

exports.listPets = function(req, res) {
    const response = Response(req, 200);
    response.push({ id: 1, name: 'Mittens' });
    response[0].tag = 'Cat';
    res.json(response);    // returns JSON: [{"id":1,"name":"Mittens","tag":"Cat"}]
};
```

### Property Error Example

Using the [Example Swagger Definition File](#example-swagger-definition-file):

**pets.js**

```js
const Response = require('swagger-response');

exports.listPets = function(req, res) {
    const response = Response(req, 200);
    response.push({ id: 1, name: 'Mittens' });
    response[0].type = 'Cat';       // throws an Error - there is no type property
    res.json(response);             // returns an error message
};
```

### Type Error Example

Using the [Example Swagger Definition File](#example-swagger-definition-file):

**pets.js**

```js
const Response = require('swagger-response');

exports.listPets = function(req, res) {
    const response = Response(req, 200);
    response.push('hello');         // throw an Error - the item must be an object
    response.push({ id: 1, name: 'Mittens' });
    response[0].tag = 1234;         // throws an Error - the tag expects a string
    res.json(response);             // returns an error message
};
```

## Caveats

### Swagger Versions

Currently only version 2.x is supported.

### Management Limitations

The swagger response object can only manage mutable variables, otherwise you'll need to make assignments and that would overwrite the swagger response object. To prevent this, if you attempt to use a swagger response object for a primitive response then an error will be thrown.

### Arrays

The swagger response object does not use the Array object, instead it uses an object that mimics the Array but provides validation. The only case where this may be a problem is when you are trying to set a value to an index that is beyond the length of the existing array.

If you must set a value beyond the length of the array, use the `set` function.

**Example**

```js
const Response = require('swagger-response');

exports.listPets = function(req, res) {
    const response = Response(req, 200);
    response.set(1, { id: 2, name: 'Jack' });   // array length is now 2
    response[0] = { id: 1, name: 'Mittens' };   // valid because the array length > 0
    res.json(response); // returns [{"id":1,"name":"Mittens"},{"id":2,"name":"Jack"}]
};
```

## Example Swagger Definition File

All examples on this page use this same swagger definition file:

```json
{
  "swagger": "2.0",
  "paths": {
    "/pets": {
      "x-swagger-router-controller": "pets",
      "get": {
        "summary": "List all pets",
        "operationId": "listPets",
        "responses": {
          "200": {
            "description": "An paged array of pets",
            "schema": {
              "$ref": "#/definitions/Pets"
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
    }
  }
}
```