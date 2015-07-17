module.exports = function(grunt){
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-compress");

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint : {
			files : ['src/pivotds.js'],
			options : {}
		},
		uglify : {
			dist : {
				src : ["src/pivotds.js"],
				dest : "dist/pivotds.min.js"
			}
		},
		copy : {
			main : {
				files : [{
					expand: true,
					cwd: 'src/',
					src: ['pivotds.js'],
					dest: 'dist/',
				}]
			}
		},
		compress : {
			main : {
				options : {
					archive: 'dist.zip',
					mode: "zip",
					pretty: true
				},
				files : {
					"pivotds_v<%= pkg.version %>" : ["dist/**","LICENSE.txt"]
				}
			}
		}
	});

	grunt.registerTask("test", ["jshint"]);
	grunt.registerTask("default", ["jshint","uglify","copy","compress"]);
	
};

