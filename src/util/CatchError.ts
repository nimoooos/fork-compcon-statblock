import Vue from 'vue'

/**
 * A decorator that wraps an asynchronous method with error handling.
 * 
 * When applied, this decorator catches any errors thrown within the method, 
 * logs the error to the console, and triggers a notification using Vue's 
 * `$notify` method. The notification will display the name of the method 
 * and an 'error' message type.
 *
 * Usage:
 * ```ts
 * @CatchError()
 * public async someAsyncMethod() {
 *   // Your method logic here
 * }
 * ```
 * 
 * @returns {Function} The original method wrapped with error handling.
 */
export function CatchErrorAsyncMethod(): Function {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
  
      descriptor.value = async function (...args: any[]) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          console.error(error);
          Vue.prototype.$notify(`${propertyKey}()`, 'error');
        }
      };
  
      return descriptor;
    };
  }