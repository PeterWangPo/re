function f(){
	console.log('aaaa');
}
let [x = f()] = [1];
console.log(x);
