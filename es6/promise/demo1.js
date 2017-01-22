var p1 = new Promise((resolve, reject) => {
	//setTimeout(() => reject(new Error('fail')), 3000);
	setTimeout(() => resolve('hello'), 3000);
});
var p2 = new Promise((resolve, reject) => {
	//p2里面调用了p1,也就是说p2的状态取决于p1的状态
	setTimeout(() => resolve(p1), 1000);
});
//页面所有的同步执行完成后，才会执行异步操作
p2.then(result => console.log(result)).catch(error => console.log(error));
console.log(2222);
