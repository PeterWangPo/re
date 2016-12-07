//顶层对象浏览器中指的是window对象,nodejs里面指的是global对象
//在es5中  顶层对象赋值和全局变量声明是一样的.全局变量声明挂载到window上面
//es6中，全局声明的var变量和function函数也是挂载到window上面，但是let const class声明的全局变量则不属于顶层对象
var a = 1;
console.log(window.a);
let b = 2;
console.log(window.b); //报错
