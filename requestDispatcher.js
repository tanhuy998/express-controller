//const Controller = require('../controller/baseController.js').proxy;
const PreInvokeFunction = require('./preInvokeFunction.js');
const {DecoratorResult, DecoratorType, MethodDecorator, PropertyDecorator, ClassDecorator} = require('./decoratorResult.js');
const BaseController = require('./baseController.js');


const Decorator =  {
    dispatchRequest,
    requestParam,
    httpContext: httpContext,
}

function args(..._args) {

    return function (target, key, descriptor) {

        const the_function = descriptor.value;

        if (typeof the_function != 'function') throw new Error('args decorator error: just use decorator for function object');

        const argPassed_funtion  = new PreInvokeFunction(the_function, ..._args);

        descriptor.value = argPassed_funtion;

        return descriptor;
    }
}

function preprocessDescriptor(_targetObject, propName, descriptor, decoratorType = DecoratorType.PROPERTY_DECORATOR) {

    if (decoratorType = DecoratorType.PROPERTY_DECORATOR) {

        const the_target_prop = descriptor.value;

        let decoratorResult;
        let the_transformed_prop;
        // let result;

        // let the_prop_is_function = false;
        

        if (!(the_target_prop instanceof DecoratorResult)) {

            if (typeof the_target_prop == 'function') {

                the_transformed_prop = new PreInvokeFunction(the_target_prop);
                //the_prop_is_function = true;
                return new MethodDecorator(_targetObject, the_transformed_prop).bind(_targetObject);
            }
            else {
                
                the_transformed_prop = the_target_prop;

                return new PropertyDecorator(_targetObject, propName).bind(_targetObject);  
            }
            //decoratorResult = new DecoratorResult(DecoratorType.PROPERTY_DECORATOR, the_transformed_prop);
        }
        else {

            decoratorResult = the_target_prop.bind(_targetObject);

            return decoratorResult;
            //if (decoratorResult._target instanceof PreInvokeFunction) the_prop_is_function = true;
        }
    }
}

function requestParam(...argsInfo) {
    console.log(argsInfo)
    /**
     * 
     * @param {PreInvokeFunction} _theMethod 
     */
    const passRequestParam = function (_theMethod, ...decoratorResultPayload) {

        // context of "this" here is the Controller's context
        //console.log(this);
        const reqParams = this.httpContext.request.params || {};

        const method_params = decoratorResultPayload || [];

        const args = method_params.map((name) => {

            return reqParams[name];
        })

        _theMethod.passArgs(...args);
    };

    const transformProperty = function(decoratorResultTarget, ...decoratorResultPayload) {
        //console.log('transform', decoratorResultTarget)
        // this context of the function is the controller object
        const reqParams = this.httpContext.request.params || {};

        const {propName} = decoratorResultTarget;
        
        const new_value = {};

        const length = decoratorResultPayload.length;

        if (length == 0) {

            this[propName] = reqParams;

            return;
        }

        if (length == 1) {

            const param_name = decoratorResultPayload[0];

            this[propName] = reqParams[param_name];

            return;
        }

        for (const param_name of decoratorResultPayload) {

            new_value[param_name] = reqParams[param_name]
        }

        this[propName] = new_value;
    };

    const resolveMethod = function(decoratorResult, _targetObject, propName, descriptor) {
        //console.log('resolve method');
        // target instanceof PreInvokeFuncion
        //const target = decoratorResult._target;
        decoratorResult.payload['requestParam'] = argsInfo;
        decoratorResult.transform(passRequestParam, 'requestParam');
        decoratorResult.bind(_targetObject);

        descriptor.value = decoratorResult;

        return descriptor;
    }

    const resolveProperty = function(decoratorResult, _targetObject, propName, descriptor) {

        decoratorResult.payload['requestParam:prop'] = argsInfo;
        decoratorResult.transform(transformProperty, 'requestParam:prop');
        decoratorResult.bind(_targetObject);
        //console.log(Object.getOwnPropertyNames(_targetObject))
        // _targetObject is instance of BaseController class
        //_targetObject.pushDecoratedProp(decoratorResult);
        descriptor.initializer = () => decoratorResult;
        
        return descriptor;
    }

    //console.log('requestParam Decorator')
    return function (_targetObject, propName, descriptor) {
        
        const decoratorResult = preprocessDescriptor(_targetObject, propName, descriptor);
        
        //const {decoratorResult} = preprocessed_descriptor;
        // the param's context here the context when controller is seted-up http context
    
        switch(decoratorResult.constructor.name) {
            
            case 'PropertyDecorator': 
                return resolveProperty(decoratorResult, _targetObject, propName, descriptor);
            case 'MethodDecorator': 
                return resolveMethod(decoratorResult, _targetObject, propName, descriptor);
            default: 
                return descriptor;
        }
    }
}

const HttpContextCatcher = {
    subcribers: [],
    currentContext: {},
    newContext: function(_httpContext) {
        this.currentContext = _httpContext;
    
        for (const subcriber of this.subcribers) {
    
            subcriber.httpContext = _httpContext;
        }
    }
}

function httpContext(_theConstructor) {
    //console.log('httpcontext decorator', _theConstructor)
    HttpContextCatcher.subcribers.push(_theConstructor);

    return _theConstructor;
}

function initContext(arg) {
    //console.log(arg)
    return function (_theConstructor) {
        //console.log('initContext');
        return _theConstructor;
    }
}




//function dispatchRequest(controllerObject, controllerAction, _controllerClass) {
function dispatchRequest(_controllerClass, _prop) {

    return function(req, res, next) {

        const context = {

            request: req,
            response: res,
            nextMiddleware: next,
            currentRoute: req.path,
            parentRoute: req.baseUrl,
            //routeContext: _router || undefined,
        }
        BaseController.httpContext = context;
        HttpContextCatcher.newContext(context);
        //console.log(prop)
        controllerObject = new _controllerClass();

        controllerObject.setContext(context);
        
        controllerObject.resolveProperty();

        const controllerAction = controllerObject[_prop];

        // const req_params = req.params;

        // const param_arr = [];

        // for (const key in req_params) {

        //     param_arr.push(req_params[key]);
        // }

        //return controllerAction(...param_arr);



        if (controllerAction instanceof DecoratorResult) {

            return controllerAction.bind(controllerObject)
                            .resolve();

            //return controllerAction.resolve();
        }
        
        return controllerAction();
    }
}

module.exports = {
    dispatchRequest,
    requestParam,
    httpContext,
    initContext
};