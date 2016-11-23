function View(name,options){
    this.name = name;
}
View.prototype.test = function(){
    console.log('test');
};
View.test2 = function(){
  console.log('test2');
};
module.exports = View;