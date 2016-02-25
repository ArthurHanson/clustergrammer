// var crossfilter = require('crossfilter');
var utils = require('../utils');
var zoomed = require('../zoom/zoomed');
var ini_doubleclick = require('../zoom/ini_doubleclick');
var get_svg_dim = require('../params/get_svg_dim');
var is_force_square = require('../params/is_force_square');
var set_clust_width = require('../params/set_clust_width');
var reset_zoom = require('../zoom/reset_zoom');
var resize_dendro = require('./resize_dendro');
var resize_grid_lines = require('./resize_grid_lines');
var resize_super_labels = require('./resize_super_labels');
var resize_spillover = require('./resize_spillover');
var resize_borders = require('./resize_borders');
var resize_row_labels = require('./resize_row_labels');
var resize_highlights = require('./resize_highlights');
var normal_name = require('./normal_name');
var bound_label_size = require('./bound_label_size');
var resize_row_viz = require('./resize_row_viz');

module.exports = function(params, inst_clust_width, inst_clust_height, set_margin_left, set_margin_top) {

  var row_nodes = params.network_data.row_nodes;
  var col_nodes = params.network_data.col_nodes;
  var row_nodes_names = _.pluck(row_nodes, 'name');
  var col_nodes_names = _.pluck(col_nodes, 'name');

  reset_zoom(params);

  // size the svg container div - svg_div
  d3.select(params.viz.viz_wrapper)
      .style('float', 'right')
      .style('margin-top',  set_margin_top  + 'px')
      .style('width',  inst_clust_width  + 'px')
      .style('height', inst_clust_height + 'px');


  // Resetting some visualization parameters
  params = get_svg_dim(params);
  params = set_clust_width(params);
  params = is_force_square(params);  

  // zoom_switch from 1 to 2d zoom
  params.viz.zoom_switch = (params.viz.clust.dim.width / params.viz.num_col_nodes) / (params.viz.clust.dim.height / params.viz.num_row_nodes);

  // zoom_switch can not be less than 1
  if (params.viz.zoom_switch < 1) {
    params.viz.zoom_switch = 1;
  }


  // Begin resizing the visualization


  // resize the svg
  ///////////////////////
  var svg_group = d3.select(params.viz.viz_svg)
    .attr('width', params.viz.svg_dim.width)
    .attr('height', params.viz.svg_dim.height);

  // redefine x_scale and y_scale rangeBands
  params.matrix.x_scale.rangeBands([0, params.viz.clust.dim.width]);
  params.matrix.y_scale.rangeBands([0, params.viz.clust.dim.height]);

  // redefine x and y positions
  _.each(params.network_data.links, function(d){
    d.x = params.matrix.x_scale(d.target);
    d.y = params.matrix.y_scale(d.source);
  });

  // precalc rect_width and height
  params.matrix.rect_width = params.matrix.x_scale.rangeBand();
  params.matrix.rect_height = params.matrix.y_scale.rangeBand();

  // redefine zoom extent
  params.viz.real_zoom = params.norm_label.width.col / (params.matrix.rect_width/2);

  // disable zoom while transitioning
  svg_group.on('.zoom', null);

  params.zoom_behavior
    .scaleExtent([1, params.viz.real_zoom * params.viz.zoom_switch])
    .on('zoom', function(){
      zoomed(params);
    });

  // reenable zoom after transition
  if (params.viz.do_zoom) {
    svg_group.call(params.zoom_behavior);
  }

  // prevent normal double click zoom etc
  ini_doubleclick(params);

  // redefine border width
  params.viz.border_width = params.matrix.rect_width / 55;

  // the default font sizes are set here
  params.labels.default_fs_row = params.matrix.rect_height * 1.07;
  params.labels.default_fs_col = params.matrix.rect_width * 0.87  ;

  svg_group.select('.super_background')
    .style('width', params.viz.svg_dim.width)
    .style('height', params.viz.svg_dim.height);

  svg_group.select('.grey_background')
    .attr('width', params.viz.clust.dim.width)
    .attr('height', params.viz.clust.dim.height);

  // resize rows and tiles within rows

  svg_group.selectAll('.row')
    .attr('transform', function(d){
      var tmp_index = _.indexOf(row_nodes_names, d.name);
      return 'translate(0,'+params.matrix.y_scale(tmp_index)+')';
    });

  // reset tiles
  svg_group.selectAll('.row')
    .selectAll('.tile')
    .attr('transform', function(d){
      var x_pos = params.matrix.x_scale(d.pos_x) + 0.5*params.viz.border_width;
      var y_pos = 0.5*params.viz.border_width/params.viz.zoom_switch;
      return 'translate('+x_pos+','+y_pos+')';
    })
    .attr('width', params.matrix.rect_width)
    .attr('height', params.matrix.rect_height);

  // reset tile_up
  svg_group.selectAll('.row')
    .selectAll('.tile_up')
    .attr('d', function() {
        // up triangle
        var start_x = 0;
        var final_x = params.matrix.x_scale.rangeBand();
        var start_y = 0;
        var final_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand() /60;

        var output_string = 'M' + start_x + ',' + start_y + ', L' +
        start_x + ', ' + final_y + ', L' + final_x + ',0 Z';

        return output_string;
      })
      .attr('transform', function(d) {
        var x_pos = params.matrix.x_scale(d.pos_x) + 0.5*params.viz.border_width;
        var y_pos = 0.5*params.viz.border_width/params.viz.zoom_switch;
        return 'translate(' + x_pos + ','+y_pos+')';
      });

  svg_group.selectAll('.row')
    .selectAll('.tile_dn')
    .attr('d', function() {
        // dn triangle
        var start_x = 0;
        var final_x = params.matrix.x_scale.rangeBand();
        var start_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand() /60;
        var final_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand() /60;

        var output_string = 'M' + start_x + ', ' + start_y + ' ,   L' +
        final_x + ', ' + final_y + ',  L' + final_x + ',0 Z';

        return output_string;
      })
      .attr('transform', function(d) {
        var x_pos = params.matrix.x_scale(d.pos_x) + 0.5*params.viz.border_width;
        var y_pos = 0.5*params.viz.border_width/params.viz.zoom_switch;
        return 'translate(' + x_pos + ','+y_pos+')';
      });

  svg_group.selectAll('.highlighting_rect')
    .attr('width', params.matrix.x_scale.rangeBand() * 0.80)
    .attr('height', params.matrix.y_scale.rangeBand() * 0.80);

  svg_group.selectAll('.tile_split_up')
    .attr('d', function() {
      var start_x = 0;
      var final_x = params.matrix.x_scale.rangeBand();
      var start_y = 0;
      var final_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand()/60;
      var output_string = 'M' + start_x + ',' + start_y + ', L' +
        start_x + ', ' + final_y + ', L' + final_x + ',0 Z';
      return output_string;
    });

  svg_group.selectAll('.tile_split_dn')
    .attr('d', function() {
      var start_x = 0;
      var final_x = params.matrix.x_scale.rangeBand();
      var start_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand()/60;
      var final_y = params.matrix.y_scale.rangeBand() - params.matrix.y_scale.rangeBand()/60;
      var output_string = 'M' + start_x + ', ' + start_y + ' ,   L' +
        final_x + ', ' + final_y + ',  L' + final_x + ',0 Z';
      return output_string;
    });

  resize_highlights(params);


  // resize row labels
  ///////////////////////////

  resize_row_labels(params, svg_group);

  svg_group.selectAll('.row_label_text')
    .select('text')
    .style('font-size', params.labels.default_fs_row + 'px')
    .text(function(d){ return normal_name(params, d);});

  // change the size of the highlighting rects
  svg_group.selectAll('.row_label_text')
    .each(function() {
      var bbox = d3.select(this).select('text')[0][0].getBBox();
      d3.select(this)
        .select('rect')
        .attr('x', bbox.x )
        .attr('y', 0)
        .attr('width', bbox.width )
        .attr('height', params.matrix.rect_height)
        .style('fill', 'yellow')
        .style('opacity', function(d) {
          var inst_opacity = 0;
          // highlight target genes
          if (d.target === 1) {
            inst_opacity = 1;
          }
          return inst_opacity;
        });
    });






    if (utils.has( params.network_data.row_nodes[0], 'value')) {

      // set bar scale
      var enr_max = Math.abs(_.max( params.network_data.row_nodes, function(d) { return Math.abs(d.value); } ).value) ;
      params.labels.bar_scale_row = d3.scale
        .linear()
        .domain([0, enr_max])
        .range([0, params.norm_label.width.row ]);

      svg_group.selectAll('.row_bars')
        .attr('width', function(d) {
          var inst_value = 0;
          inst_value = params.labels.bar_scale_row( Math.abs(d.value) );
          return inst_value;
        })
        .attr('x', function(d) {
          var inst_value = 0;
          inst_value = -params.labels.bar_scale_row( Math.abs(d.value) );
          return inst_value;
        })
        .attr('height', params.matrix.rect_height );

    }

    // resize col labels
    ///////////////////////
    svg_group.select(params.root+' .col_container')
      .attr('transform', 'translate(' + params.viz.clust.margin.left + ',' +
      params.norm_label.margin.top + ')');

    svg_group.select(params.root+' .col_container')
      .select('.white_bars')
      .attr('width', 30 * params.viz.clust.dim.width + 'px')
      .attr('height', params.norm_label.background.col);

    svg_group.select(params.root+' .col_container')
      .select('.col_label_outer_container')
      .attr('transform', 'translate(0,' + params.norm_label.width.col + ')');

    // offset click group column label
    var x_offset_click = params.matrix.rect_width / 2 + params.viz.border_width;
    // reduce width of rotated rects
    var reduce_rect_width = params.matrix.rect_width * 0.36;

    svg_group.selectAll('.col_label_text')
      .attr('transform', function(d) {
        var inst_index = _.indexOf(col_nodes_names, d.name);
        return 'translate(' + params.matrix.x_scale(inst_index) + ') rotate(-90)';
      });

    svg_group.selectAll('.col_label_click')
      .attr('transform', 'translate(' + params.matrix.rect_width / 2 + ',' + x_offset_click + ') rotate(45)');

    svg_group.selectAll('.col_label_click')
      .select('text')
      .attr('y', params.matrix.rect_width * 0.60)
      .attr('dx', 2 * params.viz.border_width)
      .style('font-size', params.labels.default_fs_col + 'px')
      .text(function(d){ return normal_name(params, d);});


  bound_label_size(params, svg_group);


  svg_group.selectAll('.row_label_text')
    .select('text')
    .attr('y', params.matrix.rect_height * 0.5 + params.labels.default_fs_row*0.35 ); 

  resize_row_viz(params, svg_group);

  // svg_group.select('.row_viz_container')
  //   .attr('transform', 'translate(' + params.norm_label.width.row + ',0)');

  // svg_group.select('.row_viz_container')
  //   .select('white_bars')
  //   .attr('width', params.class_room.row + 'px')
  //   .attr('height', function() {
  //     var inst_height = params.viz.clust.dim.height;
  //     return inst_height;
  //   });

  svg_group.selectAll('.row_viz_group')
    .attr('transform', function(d) {
        var inst_index = _.indexOf(row_nodes_names, d.name);
        return 'translate(0, ' + params.matrix.y_scale(inst_index) + ')';
      });

  svg_group.selectAll('.row_viz_group')
    .select('path')
    .attr('d', function() {
      var origin_x = params.class_room.symbol_width - 1;
      var origin_y = 0;
      var mid_x = 1;
      var mid_y = params.matrix.rect_height / 2;
      var final_x = params.class_room.symbol_width - 1;
      var final_y = params.matrix.rect_height;
      var output_string = 'M ' + origin_x + ',' + origin_y + ' L ' +
        mid_x + ',' + mid_y + ', L ' + final_x + ',' + final_y + ' Z';
      return output_string;
    });    

  svg_group.selectAll('.col_label_click')
    .each(function() {
      d3.select(this)
        .select('text')[0][0]
        .getBBox();
    });

  // resize column triangle
  svg_group.selectAll('.col_label_click')
    .select('path')
    .attr('d', function() {
      // x and y are flipped since its rotated
      var origin_y = -params.viz.border_width;
      var start_x = 0;
      var final_x = params.matrix.rect_width - reduce_rect_width;
      var start_y = -(params.matrix.rect_width - reduce_rect_width +
      params.viz.border_width);
      var final_y = -params.viz.border_width;
      var output_string = 'M ' + origin_y + ',0 L ' + start_y + ',' +
        start_x + ', L ' + final_y + ',' + final_x + ' Z';
      return output_string;
    })
    .attr('fill', function(d) {
      var inst_color = '#eee';
      if (params.labels.show_categories) {
        inst_color = params.labels.class_colors.col[d.cl];
      }
      return inst_color;
    });


    svg_group.selectAll('.col_bars')
      .attr('width', function(d) {
        var inst_value = 0;
        if (d.value > 0){
          inst_value = params.labels.bar_scale_col(d.value);
        }
        return inst_value;
      })
      // rotate labels - reduce width if rotating
      .attr('height', params.matrix.rect_width * 0.66);
  // }

  if (params.labels.show_categories){
    // change the size of the highlighting rects
    d3.selectAll(params.root+' .col_label_click')
      .each(function() {
        var bbox = d3.select(this)
          .select('text')[0][0]
          .getBBox();

        d3.select(this)
          .select('rect')
          .attr('width', bbox.width * 1.1)
          .attr('height', 0.67*params.matrix.rect_width)
          .style('fill', function(d){
            var inst_color = 'white';
            if (params.labels.show_categories){
              inst_color = params.labels.class_colors.col[d.cl];
            }
            return inst_color;
          })
          .style('opacity', 0.30);
      });
  }

  resize_dendro(params, svg_group);

  resize_grid_lines(params, svg_group);

  resize_super_labels(params, svg_group);

  resize_spillover(params, svg_group);

  resize_borders(params, svg_group);

  // reset zoom and translate
  params.zoom_behavior
    .scale(1)
    .translate([ params.viz.clust.margin.left, params.viz.clust.margin.top ]);

  d3.select(params.viz.viz_svg).style('opacity',1);
};
