// resize parent div 
function parent_div_size(params) {

  // get outer_margins
  if (params.viz.expand == false) {
    var outer_margins = params.viz.outer_margins;
  } else {
    var outer_margins = params.viz.outer_margins_expand;
  }

  if (params.viz.resize) {

    // get the size of the window
    var screen_width = window.innerWidth;
    var screen_height = window.innerHeight;

    // define width and height of clustergram container
    var cont_dim = {};
    cont_dim.width = screen_width - outer_margins.left - outer_margins.right;
    cont_dim.height = screen_height - outer_margins.top - outer_margins.bottom;

    // size the svg container div - svg_div
    d3.select(params.viz.viz_wrapper)
      .style('float', 'right')
      .style('margin-top', outer_margins.top + 'px')
      .style('width', cont_dim.width + 'px')
      .style('height', cont_dim.height + 'px');

  } else {

    // size the svg container div - svg_div
    d3.select(params.viz.viz_wrapper)
      .style('float', 'right')
      .style('margin-top', outer_margins.top + 'px');
  }
}
