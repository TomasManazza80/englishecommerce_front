import React from "react";

export const Team = (props) => {
  const imgStyle = {
    width: "200px", // Ajusta el tamaño según tus necesidades
    height: "200px", // Ajusta el tamaño según tus necesidades
    objectFit: "cover", // Mantiene la proporción de la imagen
    borderRadius  : "15px"
  };

  return (
    <div id="team" className="text-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 section-title">
          <h2>Nuestros Profesionales</h2>
          <p>
          Conoce a los profesionales dedicados a brindarte el mejor servicio.
          </p>
        </div>
        <div id="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-3 col-sm-6 team">
                  <div className="thumbnail">
                    <img src={d.img} alt="..." className="team-img" style={imgStyle} />
                    <div className="caption">
                      <h4>{d.name}</h4>
                      <p>{d.job}</p>
                    </div>
                  </div>
                </div>
              ))
            : "loading"}
        </div>
      </div>
    </div>
  );
};
