//块级作用域可无限嵌套，每个块里面只能访问自己块里面的let变量
{
	let a = 1;
	{
		let a = 2;
		console.log(a);
	}
	console.log(a);
}
