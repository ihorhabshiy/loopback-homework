'use strict';

var io = require('../io');
var forbiddenWords = ['zrada', 'зрада'];

var textValidator = function (err) {
	for (let word of forbiddenWords)
		if (this.text.includes(word))
			err();
};

module.exports = function(Todo) {
	Todo.validate('text', textValidator, { message: 'Only peremoga allowed!'});

	Todo.observe('after delete', function (ctx, next) {
		io.getSocketIo().emit('todo:deleted', ctx.where._id);
		next();
	});

	Todo.observe('after save', function (ctx, next) {
		io.getSocketIo().emit(ctx.isNewInstance ? 'todo:added' : 'todo:updated', ctx.instance);
		next();
	});
};
