/*For future globalization*/

var Resources = {
 en: {
 Interactive_Polytopes: "Interactive Polytopes",
 About1: "This is an attempt to visualize some polytopes in 4th (and higher) dimention.",
 About2: "First, here is presented an analogy in usual three-dimentional space. The most-left picture shows a polyhedron (use mouse to orbit, zoom or pan it). The most-right shows it's stereographic projection. In the middle there is its projection to two-dimentional plane: all vertices and edges are present, but z-component of the vertices is ignored. Filled polygon is a section of the polyhedron by a plane, normal to direction of projection. Choose this direction by sliders &phi; and &theta;, or input components of normal vector. <i>h</i> is the distance of the section plane from the center (it's also presented as the length of \"normal\" vector). Another way to define a section plane is to give three points. Double-click anywhere on polyhedron to add a point, double-click on a point to remove it, drag and drop a point to change its location on the surface of the polyhedron. When the number of points is sufficient ot define a plane (3), the section plane goes through them.",
 About3: "The secont part shows the same way some regular four-dimentional polytopes. Of cours, there are no analogy of the first picture, but the second and the third shows the same: section of the polytope by three-dimentional hyperplane (yellow polyhedron), projection of the polytope to the three-dimentional space (green wireframe) and its steregraphic projection (blue wireframe on the right). As well as in the first part, you can orbit, zoom and pan three-dimentional objects with the mouse and choose rotation and distance of the section plane by the sliders and text input fields. Defining the section hyperplane with the points is also avalaible: double-click somewhere on the edges of the projection to add a point. You need 4 points to define a 3d-hyperplane. Simplex, tesseract, hyperoctahedron and C24 are regular 4-dimentional polytopes (C120 and C600 coming soon ;) ). C10 is a section of 5-dimentional hypercube by 4-dimentional hyperplane, normal to main diagonal and containing 10 of the hypercube vertices. It's a semiregular polytope, I don't know, if it has an own name and if C10 is correct, but it contains 10 cells (4 tetrahedra and 6 octahedra).", 
 Thanks: "This simulation is made using Three.js, many thanks to the authors.",
 Mail: "Please feel free to contact me for feedback and suggestions.",
 Sign: "Sincerely yours, Anna Alekseeva",
 
 Head3d: "Regular polyhedra",
 Main3d: "Polyhedron",
 Proj3d: "Section and projection",
 Stereo3d: "Stereographic projection",
 
 Tetrahedron: "Tetrahedron",
 Cube: "Cube",
 Octahedron: "Octahedron",
 Dodecahedron: "Dodecahedron",
 Icosahedron: "Icosahedron",
 
 Head4d: "Some regular and semiregular polytopes",
 Main4d: "Section and Projection",
 Stereo4d: "Stereographic Projection", 
 
 Simplex: "Simplex",
 Tesseract: "Tesseract",
 Hyperoctahedron: "Hyperoctahedron",
 C24: "C24",
 C10: "C10"
	
	}
}

var strings = {};

var setStrings = function (lang = "en") {
	if (Resources.hasOwnProperty(lang))
		strings = Resources[lang]
	else 
		strings = Resources.en;
}


