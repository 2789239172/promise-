/*
自定义Promise函数模块: IIFE
* */
((params) => {
  let data = Symbol('data')
  let PENDING = 'pending'
  let RESOLVED = 'resolved'
  let REJECTED = 'rejected'

  /*
    Promise构造函数
    executor: 执行器函数(同步执行)
  * */
  function Promise(executor) {
    this.status = PENDING
    this[data] = undefined //给promise对象指定一个用于存储结果数据的属性
    this.callbacks = [] // 每个元素的结构: {onResolved() {}, onRejected() {}}    

    resolve = (value) => {
      if (this.status != PENDING) {
        return
      }
      // 更改状态
      this.status = RESOLVED
      this[data] = value

      // 执行resolved函数
      this.callbacks.length > 0 && setTimeout(() => {
        this.callbacks.forEach(item => {
          item.onResolved(value)
        })
      })
    }

    reject = (reason) => {
      if (this.status != PENDING) {
        return
      }
      // 更改状态
      this.status = REJECTED
      this[data] = reason

      // 执行rejected函数
      this.callbacks.length > 0 && setTimeout(() => {
        this.callbacks.forEach(item => {
          item.onRejected(reason)
        })
      })
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  /*
    Promise原型对象的then()
    指定成功和失败的回调函数
    返回一个新的promise, promise的结果由onResolved/onRejected执行结果决定
  */
  Promise.prototype.then = function (onResolved, onRejected) {
    //指定回调函数的默认值, 必须为函数
    onResolved = typeof onResolved === 'function' ? onResolved : value => value

    // 指定默认失败的函数, 将失败的参数传递下去
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    return new Promise((resolve, reject) => {

      //执行指定回调函数根据结果设置promise状态
      const handle = (callback) => {
        //1. 抛出异常, promise为失败, reason为异常
        try {
          const result = callback(this[data])
          //2. 返回的是promise, 成功与失败取决于自身
          if (result instanceof Promise) {
            result.then(resolve, reject)

            //3. 返回非promise, 设置成功, value为返回值
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }

      // 成功状态, 执行onResolved
      if (this.status === RESOLVED) {
        setTimeout(() => {
          handle(onResolved)
        })

      } else if (this.status === REJECTED) {// 失败
        setTimeout(() => {
          handle(onRejected)
        })
      } else { // 状态未改变
        //将成功和失败的回调保存, 并且使函数可以改变当前 'then' 的状态
        this.callbacks.push({
          onResolved() {
            handle(onResolved)
          },
          onRejected() {
            handle(onRejected)
          }
        })
      }
    })
  }

  /*
    Promise原型对象的catch()
    指定失败的回调函数
    返回一个新的promise
  */
  Promise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected)
  }

  /*
    Promise函数对象的resolve()
    返回一个指定结果, 成功/失败 的promise
  */
  Promise.resolve = function (value) {
    if (value instanceof Promise) {
      return value.then()
    } else {
      return new Promise((resolve, reject) => {
        resolve(value)
      })
    }
  }

  /*
    Promise函数对象的resolve()
    返回一个指定原因的失败的promise
  */
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  /*
    Promise函数对象的all()
    返回一个promise, 所有promise都成功时才成功, 否则失败
  */
  Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
      // 存放成功的数据
      let data = new Array(promises.length)
      let counter = 0
      promises.forEach((item, i) => {
        item.then(
          value => {
            data[i] = value

            // 每成功一个计数器自增一个
            counter++
            if (counter === promises.length) {
              resolve(data) //所有都成功调用res
            }
          },
          reason => {
            reject(reason) //失败一次则调用rej
          }
        )
      })
    })

  }

  /*
    Promise函数对象的race()
    返回一个promise, 结果由第一个完成的promise决定
  */
  Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
      promises.forEach(item => {
        item.then(
          value => {
            resolve(value)
          },
          reason => {
            reject(reason)
          })
      })
    })
  }

  window.Promise = Promise
})()