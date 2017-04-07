# Swagger-Response

Don't wait until your swagger response is sent to validate it. Validate every time you update the response, prior to sending, and know the exact line number where you entered bad data.

## Example

```js
const SwaggerResponse = require('swagger-response');

const response = SwaggerResponse(schema, options, initialValue);
response.foo = { key: value };
```

## Options

* *useDefaults* - Whether to use default values to build out the swagger response object automatically, as much as possible. Defaults to `false`.
  
* *enforce* - The validation rules to enforce while building the response object.

    **General Enforcement**
    
    * *enum* - Enforce that any values added match an item in the enum. Defaults to `true`.

    **Array Enforcement**
    
    * *maxItems* - Enforce that the array is not populated above its maxItems threshold. Defaults to `true`.
    
    * *minItems* - Enforce that the array is never smaller than its minItems threshold. Defaults to `false`.
    
    * *uniqueItems* - Enforce that each item in the array is always unique. Enabling this option may significantly increase processing time (more so for nested objects and arrays). Defaults to `false`.

    **Number and Integer Enforcement** 

    * *multipleOf* - Enforce multipleOf validation for numbers and integers. Defaults to `true`.
    
    * *maximum* - Enforce maximum validation for numbers and integers. Defaults to `true`.
    
    * *minimum* - Enforce minimum validation for numbers and integers. Defaults to `true`.

    **String Enforcement** 

    * *maxLength* - Enforce maxLength validation. Defaults to `true`.
    
    * *minLength* - Enforce minLength validation for numbers and integers. Defaults to `true`.
    
    * *pattern* - Enforce pattern matching. Defaults to `true`.

    **Object Enforcement** 

    * *maxProperties* - Enforce maxProperties validation. Defaults to `true`.
    
    * *minProperties* - Enforce minProperties validation for numbers and integers. Defaults to `false`.
    
    * *required* - Enforce pattern matching. If enabled then any objects being set into the response must already have required values. Defaults to `false`.