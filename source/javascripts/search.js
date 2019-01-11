/*global d3 */

// construct query string
var params = d3.select("#search-form");

if (!params.empty()) {
  var site_url = params.attr('data-site-url');
  var search_url = params.attr('data-search-url');
  var page = getParameterByName('page');
  if (page === null) { page = 1; }
  var per_page = 10;
  var query = getParameterByName('query');
  var tag = getParameterByName('tag');

  var query_url = encodeURI(search_url + "/pages?page[size]=" + per_page + "&page[number]=" + page);
  if (query !== null) { query_url += "&query=" + query; }
  if (tag !== null) { query_url += "&tag=" + tag; }
}

// load the data from the DataCite API
if (query_url) {
  d3.json(query_url)
    .get(function (error, json) {
      if (error) { return console.warn(error); }
      searchResult(json);

      json.meta["page"] = page;
      json.meta["total_pages"] = Math.ceil(json.meta.total / per_page);
      paginate(json, "#content");
    });
}

// add search results to page
function searchResult(json) {
  data = json.data;
  meta = json.meta;

  d3.select("#query").property("value", query);

  json.href = "?page={{number}}";
  if (query !== null) { json.href += "&query=" + query; }
  if (tag !== null) { json.href += "&tag=" + tag; }

  if (typeof data === "undefined" || data.length === 0) {
    d3.select("#content").text("")
      .insert("div")
      .attr("class", "alert alert-info")
      .text("No blog posts found.");
    return;
  }

  if (json.meta.total > 1) {
    d3.select("#content").insert("h3")
      .attr("class", "results")
      .text(numberWithDelimiter(json.meta.total) + " Posts");
  }

  for (var i = 0; i < data.length; i++) {
    var post = data[i];
    post["url"] = post.attributes.url.replace(/https:\/\/blog.datacite.org/, site_url);

    d3.select("#content").insert("div")
      .attr("class", "panel panel-default post-list")
      .attr("id", "panel-" + i).insert("div")
      .attr("class", "panel-body post-content")
      .attr("id", "panel-body-" + i);

    d3.select("#panel-body-" + i).append("header")
      .attr("class", "post-header")
      .append("h3")
      .attr("class", "work")
      .append("a")
      .attr("href", function () { return post.url; })
      .text(post.attributes.title);
    d3.select("#panel-body-" + i).append("section")
      .attr("class", "post-excerpt")
      .attr("itemprop", "description").insert("p")
      .html(post.attributes.description);

    d3.select("#panel-" + i).insert("div")
      .attr("class", "panel-footer")
      .attr("id", "panel-footer-" + i);

    if (post.attributes.issued !== null) {
      d3.select("#panel-footer-" + i).insert("span")
        .attr("class", "meta").append("time")
        .attr("datetime", post.attributes.issued)
        .text(formattedDate(post.attributes.issued.substring(0, 10)));
    } else {
      d3.select("#panel-footer-" + i).insert("span")
        .attr("class", "meta")
        .text("unpublished");
    }

    d3.select("#panel-footer-" + i).insert("span")
      .attr("class", "meta")
      .text(formattedAuthorList(post.attributes.author));

    d3.select("#panel-footer-" + i).insert("a")
      .attr("href", function () { return post.attributes.url + "#disqus_thread"; })
      .attr("data-disqus-identifier", post.attributes.url)
      .attr("class", "disqus-comment-count")
      .attr("class", "pull-right")
      .text("0 comments");
  }

  // convert tags object to array for sorting
  tags = Object.keys(meta.tags);

  if (typeof tags !== "undefined" && tags.length > 0) {
    tags.sort(function (a, b) {
      if (meta.tags[a] > meta.tags[b]) {
        return -1;
      }
      if (meta.tags[a] < meta.tags[b]) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });

    d3.select("#tags")
      .classed("panel facets", true).insert("div")
      .attr("class", "panel-body").insert("h4")
      .text("Tags");

    d3.select("#tags .panel-body").insert("ul");

    for (k = 0; k < tags.length; k++) {
      var key = tags[k];
      if (tag === key) {
        d3.select("#tags .panel-body ul").insert("li")
          .append("a")
          .attr("href", function () { return "/index.html"; }).insert("i")
          .attr("class", "fa fa-check-square-o");
      } else {
        d3.select("#tags .panel-body ul").insert("li")
          .append("a")
          .attr("href", function () { return "/index.html?tag=" + key; }).insert("i")
          .attr("class", "fa fa-square-o");
      }
      d3.select("#tags .panel-body ul li:last-child").insert("span")
        .text(key);
      d3.select("#tags .panel-body ul li:last-child").insert("span")
        .attr("class", "number pull-right")
        .text(meta.tags[key]);

    }
  }
}
