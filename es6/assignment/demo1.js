//es5中只能单个变量进行赋值
//es6中支持解构赋值,等号右侧必须是数组,否则解析就会报错
var [a, b, c] = [1, 2, 3];
//这样a赋值为1  b赋值为2 c赋值为3
console.log(a,b,c);

//只要模式匹配，都可以赋值，
let [foo, [[bar], [baz]]] = [11, [[22], [33]]];
console.log(foo,bar,baz);

let [, , g] = [111, 222, 333];
console.log(g);

let [d, , e] = [6, , 7];
console.log(d,e);

let [aa, bb, cc] = [123];
console.log(aa,bb,cc); //解析不成功就返回undefined

let [ab, ...ac] = [999,888,777,666,5555]; //...表示匹配剩余部分
console.log(ab,ac);

let [bc, bd, ...ba] = [1];
console.log(bc,bd,ba);
