//const声明一个只读变量，声明后就初始化好了，后面不能改变其值
//const和let一样，也是快级作用域内有效
//const声明的常量也存在暂时性死区，只能在声明后使用,不会存在变量提升的功能
//const声明过的变量不能再次声明，不管改变量是var还是let声明的
//const声明的复合型数据，是指向改变量的地址不变，但是数据有可能会变化....
const foo = {};
console.log(foo);
foo.name = 123;
console.log(foo);
//如果声明一个无法操作的复合型常量呢？使用Object.freeze方法
const bar = Object.freeze({});
bar.name = 123;//严格模式下报错，常规模式无效
console.log(bar); //输出还是{}

