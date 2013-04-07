util.News = new Class.create({
	
	init : function() {
		this.base = 'http://api.feedzilla.com/v1/';
        this.categories = {};
        this.getCategories();
	},
	
	getCategories : function(callback , scope) {
		callback = callback || NOOP;
		var url = this.base + 'categories.json' ,
        that = this ;

		$.ajax({
		  type: "GET",
		  url: url
		}).done(function(json) {
	        	if (isArray(json)) {
					json = json.map(function(c) {
						return {
							category_id : c.category_id,
							category_name : c.english_category_name
						}
					});

                    json.forEach(function(c) {
                        that.categories[c.category_name] = c;
                    });
					callback.call(scope,json);
				}					  
		});		
/*
		$.getJSON(url, {}, 
			function(json) {
	        	if (isArray(json)) {
					json = json.map(function(c) {
						return {
							category_id : c.category_id,
							category_name : c.english_category_name
						}
					});

                    json.forEach(function(c) {
                        that.categories[c.category_name] = c;
                    });
					callback.call(scope,json);
				}
			}
		)
*/
	},
	
	getSubcategories : function (categoryId , callback , scope) {
		callback = callback || NOOP;
		var url = this.base;
		if (categoryId) {
			url+= 'categories/' +categoryId + '/subcategories.json';
		} else {
			url+=  'subcategories.json';
		}
		$.getJSON(url, {}, 
			function(json) {
	        	if (isArray(json)) {
					json = json.map(function(c) {
						return {
							category_id : c.category_id,
							subcategory_id : c.subcategory_id,							
							subcategory_name : c.english_subcategory_name
						}
					});
					console.log(json);										
					callback.call(scope,json);
				}
			}
		)		
	},

	buildArticlesUrl : function(categoryId , subcategoryId, search) {
		var url = this.base;
		if (categoryId) {
			if (subcategoryId) {
				if (search) {
					url+= 'categories/' +categoryId + '/subcategories/'+subcategoryId +'/articles/search.json?q='+encodeURIComponent(search.query);					
				} else {
					url+= 'categories/' +categoryId + 'subcategories/'+subcategoryId +'articles.json';								
				}
			} else {
				if (search) {
					url+= 'categories/' +categoryId + '/articles/search.json?q='+encodeURIComponent(search.query);
				} else {
					url+= 'categories/' +categoryId + '/articles.json';									
				}

			}
		} else if (search) {
			url += 'articles/search.json?q='+encodeURIComponent(search.query);
		} 		
		return url;
	},
/*
	news.getArticles(22,1148,{query:'AAPL'})
	news.getArticles(2,null,{query:'AAPL'})
	
	Parameters for search:
	q - Required . The text to search for in articles.
	count - Optional. Specifies the number of articles to retrieve. May not be greater than 100. (Note the the number of articles returned may be smaller than the requested count). Default is 20.
	since - Optional. Returns articles that was published since the given date. Date should be formatted as YYYY-MM-DD
	order - Optional. The sort order of the list to be returned. Can be one of the following:
	relevance - The list will be ordered by article relevancy (most relevant is first). This is the default value.
	date - The list will be ordered by article publication date (most recent is first).
	client_source - Optional. A string representing the client that uses this request.
	title_only - Optional. A value (1 - true, 0 - false) indicating whether to fetch article title only (no summary or content). Default is 0.
*/	
	getArticles : function(categoryId , subcategoryId, search , callback , scope) {
		callback = callback || NOOP;
		var url = this.buildArticlesUrl(categoryId , subcategoryId, search)
		$.ajax({
		  type: "GET",
		  url: url
		}).done(function(json) {
		
//		$.getJSON(url, {}, 
//			function(json) {
				var articles;
	        	if (json && isArray(json.articles)) {
					articles = json.articles;
					articles = articles.map(function(article) {
						return {
							title : article.title,							
							summary : article.summary,
							link : article.url,
							source : {
								name : article.source,
								link : article.source_url
							}
						}
					});
					json = {
						title : json.description,
						articles : articles
					}
//					console.log(json);										
					articles.map(function(a) {console.log(a.title)});
					callback.call(scope,json);
				}
			}
		)				
	},
	
	// This will get all businness news
	getTickerNews : function(ticker, callback) {
		callback = callback || NOOP;
		//this.getArticles(22,1148,{query:ticker},function(j) {console.log(j) ; callback()});		
		
		$.when(
			$.ajax({
			  type: "GET",
			  url: this.buildArticlesUrl(22,1148,{query:ticker})
			}), 
			$.ajax({
			  type: "GET",
			  url: this.buildArticlesUrl(2,null,{query:ticker})
			})
			).done(function(json1 , json2) {
                var json;
                console.log(json1);
                console.log(json2);
                debugger;
                json = {articles : $.merge(json1[0].articles , json2[0].articles)};
                var articles;
                if (json && isArray(json.articles)) {
                    articles = json.articles;
                    articles = articles.map(function(article) {
                        return {
                            title : article.title,
                            summary : article.summary,
                            link : article.url,
                            source : {
                                name : article.source,
                                link : article.source_url
                            }
                        }
                    });
                    json = {
                        title : json.description,
                        articles : articles
                    }
                    articles.map(function(a) {console.log(a.title)});
                    callback();
                }
            })
		
	},	
	
	getNews : function(query , callback , category) {
		var category = category || 22;
		this.getArticles(category,null, {query:query}, callback);
	}
	
});