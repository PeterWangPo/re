/**
 * Created by wang on 2015/9/30.
 */
module.exports = function(){
    this.name = 'person';
    this.sleep = function(){
        console.log('sleep in the night');
    }
    this.eat = function(){
        console.log('eat food');
    }
}