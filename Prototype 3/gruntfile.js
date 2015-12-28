module.exports = function(grunt){
	// Project configuration. 
	grunt.initConfig({
	 	concat: {
	    	js:{
	     		src: ['src/**/*.js'],
	      		dest: 'build/src/scripts.js'
	    	}
	  	},
	 	watch: {
			scripts: {
		    	files: 'src/**/*.js',
		    	tasks: ['concat:js']
		  	}
		},
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['concat', 'watch']);
};