//赋值给默认值
var [x = 1] = [];
var [y, z = 3] = [5];
console.log(x, y, z);

//使用严格运算符===来判断一个位置是否有值,所以如果一个成员不严格等于undefined，默认值就不会生效的.
// 第二个位置严格等于undefined，所以b取默认值
var [a, b = 1] = ['a', undefined];
console.log(a, b);
//null ！== undefined所以不严格等于，所以aa的值为null
var [aa = 1] = [null];
console.log(aa);
