# Swagger-Response

Don't wait until your swagger response is sent to validate it. Validate the response as you build it, and if you mess up then know the exact line number where you entered bad data.

This package only runs on JavaScript that supports the [native Proxy interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). For NodeJS that means version 6.4.0 and newer.

## Example

```js
const SwaggerResponse = require('swagger-response');

// the schema to enforce
const schema = {
    type: 'object',
    properties: {
        num: {
            type: 'number',
            minimum: 0
        },
        str: {
            type: 'string',
            enum: ['foo', 'bar', 'baz'],
            default: 'foo'
        }
    }
};

// enforcement options
const options = {
    useDefaults: true
};

// build an object that enforces the schema
const response = SwaggerResponse(schema, options);

console.log(response);      // because 'str' had a default value: { str: 'foo' }
response.num = 5;           // validates successfully
response.str = 'abc';       // throws an error because 'abc' is not in enum
```

## API

### Constructor

#### SwaggerResponse

**Signature:** `SwaggerResponse ( schema [, options [, value] ])`

**Parameters:**

* *schema* - The schema to enforce. It is common to pull this off of the swagger configuration.

* *options* - [Enforcement options](#enforcement-options). Defaults to:

    ```
    {
        autoFormat: true,
        useDefaults: false,
        enforce: {
            enum: true,
            maxItems: true,
            minItems: false,
            uniqueItems: true,
            multipleOf: true,
            maximum: true,
            minimum: true,
            maxLength: true,
            minLength: true,
            pattern: true,
            additionalProperties: true,
            maxProperties: true,
            minProperties: false,
            required: false
        }
    }
    ```
    
* *value* - The initial value to use to build the swagger response. If provided this value will be validated.

**Returns** - The proxied response object. If the schema defines an object or an array then you can treat this just like any other object or array and enforcement will be enacted. Any other schema type defines immutable primitives that cannot be enforced beyond the initial function call, but you can always call the `SwaggerResponse` function again to validate a new primitive value. 

### Static Methods

#### injectParameters

**Signature:** `SwaggerResponse.injectParameters( [ recursive, ] value, parameters)`

**Parameters:**

* *recursive* Whether to recursively replace parameters. Only valid for objects and arrays, otherwise ignored. Defaults to `true`.

## Enforcement Options

* *autoFormat* - Whether to attempt to convert any values being set to their appropriate types. For example, if a schema expects a string of format `date-time` and this option is set to `true` then you can set the schema using a `Date` object and that object will automatically be converted to a string in `date-time` format. The advantage of using this is that it means you don't need to explicitly use the [conversion to api](#) but the disadvantage is that it may obscure some errors if the conversion shouldn't have happened.

* *useDefaults* - Whether to use default values to build out the swagger response object automatically, as much as possible. Defaults to `false`.
  
* *enforce* - The validation rules to enforce while building the response object.

    **General Enforcement**
    
    * *enum* - Enforce that any values added match an item in the enum. Defaults to `true`.

    **Array Enforcement**
    
    * *maxItems* - Enforce that the array is not populated above its maxItems threshold. Defaults to `true`.
    
    * *minItems* - Enforce that the array is never smaller than its minItems threshold. Defaults to `false`.
    
    * *uniqueItems* - Enforce that each item in the array is always unique. Enabling this option may significantly increase processing time (more so for nested objects and arrays). Defaults to `true`.

    **Number and Integer Enforcement** 

    * *multipleOf* - Enforce multipleOf validation for numbers and integers. Defaults to `true`.
    
    * *maximum* - Enforce maximum validation for numbers and integers. Defaults to `true`.
    
    * *minimum* - Enforce minimum validation for numbers and integers. Defaults to `true`.

    **String Enforcement** 

    * *maxLength* - Enforce maxLength validation. Defaults to `true`.
    
    * *minLength* - Enforce minLength validation for numbers and integers. Defaults to `true`.
    
    * *pattern* - Enforce pattern matching. Defaults to `true`.

    **Object Enforcement** 
    
    * *additionalProperties* - Enforce additional property validation. Defaults to `true`.

    * *maxProperties* - Enforce maxProperties validation. Defaults to `true`.
    
    * *minProperties* - Enforce minProperties validation for numbers and integers. Defaults to `false`.
    
    * *required* - Enforce pattern matching. If enabled then any objects being set into the response must already have required values. Defaults to `false`.