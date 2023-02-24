export declare class BRepAdaptor_CompCurve extends Adaptor3d_Curve {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  ShallowCopy(): Handle_Adaptor3d_Curve;
  Initialize_1(W: TopoDS_Wire, KnotByCurvilinearAbcissa: Standard_Boolean): void;
  Initialize_2(W: TopoDS_Wire, KnotByCurvilinearAbcissa: Standard_Boolean, First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): void;
  Wire(): TopoDS_Wire;
  Edge(U: Standard_Real, E: TopoDS_Edge, UonE: Standard_Real): void;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Trim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Curve;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  Value(U: Standard_Real): gp_Pnt;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  Resolution(R3d: Standard_Real): Standard_Real;
  GetType(): GeomAbs_CurveType;
  Line(): gp_Lin;
  Circle(): gp_Circ;
  Ellipse(): gp_Elips;
  Hyperbola(): gp_Hypr;
  Parabola(): gp_Parab;
  Degree(): Graphic3d_ZLayerId;
  IsRational(): Standard_Boolean;
  NbPoles(): Graphic3d_ZLayerId;
  NbKnots(): Graphic3d_ZLayerId;
  Bezier(): Handle_Geom_BezierCurve;
  BSpline(): Handle_Geom_BSplineCurve;
  delete(): void;
}

  export declare class BRepAdaptor_CompCurve_1 extends BRepAdaptor_CompCurve {
    constructor();
  }

  export declare class BRepAdaptor_CompCurve_2 extends BRepAdaptor_CompCurve {
    constructor(W: TopoDS_Wire, KnotByCurvilinearAbcissa: Standard_Boolean);
  }

  export declare class BRepAdaptor_CompCurve_3 extends BRepAdaptor_CompCurve {
    constructor(W: TopoDS_Wire, KnotByCurvilinearAbcissa: Standard_Boolean, First: Standard_Real, Last: Standard_Real, Tol: Standard_Real);
  }

export declare class BRepAdaptor_Curve extends Adaptor3d_Curve {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  ShallowCopy(): Handle_Adaptor3d_Curve;
  Reset(): void;
  Initialize_1(E: TopoDS_Edge): void;
  Initialize_2(E: TopoDS_Edge, F: TopoDS_Face): void;
  Trsf(): gp_Trsf;
  Is3DCurve(): Standard_Boolean;
  IsCurveOnSurface(): Standard_Boolean;
  Curve(): GeomAdaptor_Curve;
  CurveOnSurface(): Adaptor3d_CurveOnSurface;
  Edge(): TopoDS_Edge;
  Tolerance(): Standard_Real;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Trim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Curve;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  Value(U: Standard_Real): gp_Pnt;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  Resolution(R3d: Standard_Real): Standard_Real;
  GetType(): GeomAbs_CurveType;
  Line(): gp_Lin;
  Circle(): gp_Circ;
  Ellipse(): gp_Elips;
  Hyperbola(): gp_Hypr;
  Parabola(): gp_Parab;
  Degree(): Graphic3d_ZLayerId;
  IsRational(): Standard_Boolean;
  NbPoles(): Graphic3d_ZLayerId;
  NbKnots(): Graphic3d_ZLayerId;
  Bezier(): Handle_Geom_BezierCurve;
  BSpline(): Handle_Geom_BSplineCurve;
  OffsetCurve(): Handle_Geom_OffsetCurve;
  delete(): void;
}

  export declare class BRepAdaptor_Curve_1 extends BRepAdaptor_Curve {
    constructor();
  }

  export declare class BRepAdaptor_Curve_2 extends BRepAdaptor_Curve {
    constructor(E: TopoDS_Edge);
  }

  export declare class BRepAdaptor_Curve_3 extends BRepAdaptor_Curve {
    constructor(E: TopoDS_Edge, F: TopoDS_Face);
  }

export declare class BRepAdaptor_Surface extends Adaptor3d_Surface {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  ShallowCopy(): Handle_Adaptor3d_Surface;
  Initialize(F: TopoDS_Face, Restriction: Standard_Boolean): void;
  Surface(): GeomAdaptor_Surface;
  ChangeSurface(): GeomAdaptor_Surface;
  Trsf(): gp_Trsf;
  Face(): TopoDS_Face;
  Tolerance(): Standard_Real;
  FirstUParameter(): Standard_Real;
  LastUParameter(): Standard_Real;
  FirstVParameter(): Standard_Real;
  LastVParameter(): Standard_Real;
  UContinuity(): GeomAbs_Shape;
  VContinuity(): GeomAbs_Shape;
  NbUIntervals(theSh: GeomAbs_Shape): Graphic3d_ZLayerId;
  NbVIntervals(theSh: GeomAbs_Shape): Graphic3d_ZLayerId;
  UIntervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  VIntervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  UTrim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Surface;
  VTrim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Surface;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  UPeriod(): Standard_Real;
  IsVPeriodic(): Standard_Boolean;
  VPeriod(): Standard_Real;
  Value(U: Standard_Real, V: Standard_Real): gp_Pnt;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  UResolution(theR3d: Standard_Real): Standard_Real;
  VResolution(theR3d: Standard_Real): Standard_Real;
  GetType(): GeomAbs_SurfaceType;
  Plane(): gp_Pln;
  Cylinder(): gp_Cylinder;
  Cone(): gp_Cone;
  Sphere(): gp_Sphere;
  Torus(): gp_Torus;
  UDegree(): Graphic3d_ZLayerId;
  NbUPoles(): Graphic3d_ZLayerId;
  VDegree(): Graphic3d_ZLayerId;
  NbVPoles(): Graphic3d_ZLayerId;
  NbUKnots(): Graphic3d_ZLayerId;
  NbVKnots(): Graphic3d_ZLayerId;
  IsURational(): Standard_Boolean;
  IsVRational(): Standard_Boolean;
  Bezier(): Handle_Geom_BezierSurface;
  BSpline(): Handle_Geom_BSplineSurface;
  AxeOfRevolution(): gp_Ax1;
  Direction(): gp_Dir;
  BasisCurve(): Handle_Adaptor3d_Curve;
  BasisSurface(): Handle_Adaptor3d_Surface;
  OffsetValue(): Standard_Real;
  delete(): void;
}

  export declare class BRepAdaptor_Surface_1 extends BRepAdaptor_Surface {
    constructor();
  }

  export declare class BRepAdaptor_Surface_2 extends BRepAdaptor_Surface {
    constructor(F: TopoDS_Face, R: Standard_Boolean);
  }

export declare class BRepBuilderAPI_MakeShape extends BRepBuilderAPI_Command {
  Build(theRange: Message_ProgressRange): void;
  Shape(): TopoDS_Shape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  Modified(S: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  delete(): void;
}

export declare class BRepBuilderAPI_Transform extends BRepBuilderAPI_ModifyShape {
  Perform(S: TopoDS_Shape, Copy: Standard_Boolean): void;
  ModifiedShape(S: TopoDS_Shape): TopoDS_Shape;
  Modified(S: TopoDS_Shape): TopTools_ListOfShape;
  delete(): void;
}

  export declare class BRepBuilderAPI_Transform_1 extends BRepBuilderAPI_Transform {
    constructor(T: gp_Trsf);
  }

  export declare class BRepBuilderAPI_Transform_2 extends BRepBuilderAPI_Transform {
    constructor(S: TopoDS_Shape, T: gp_Trsf, Copy: Standard_Boolean);
  }

export declare class BRepBuilderAPI_ModifyShape extends BRepBuilderAPI_MakeShape {
  Modified(S: TopoDS_Shape): TopTools_ListOfShape;
  ModifiedShape(S: TopoDS_Shape): TopoDS_Shape;
  delete(): void;
}

export declare class BRepBuilderAPI_MakeSolid extends BRepBuilderAPI_MakeShape {
  Add(S: TopoDS_Shell): void;
  IsDone(): Standard_Boolean;
  Solid(): TopoDS_Solid;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  delete(): void;
}

  export declare class BRepBuilderAPI_MakeSolid_1 extends BRepBuilderAPI_MakeSolid {
    constructor();
  }

  export declare class BRepBuilderAPI_MakeSolid_2 extends BRepBuilderAPI_MakeSolid {
    constructor(S: TopoDS_CompSolid);
  }

  export declare class BRepBuilderAPI_MakeSolid_3 extends BRepBuilderAPI_MakeSolid {
    constructor(S: TopoDS_Shell);
  }

  export declare class BRepBuilderAPI_MakeSolid_4 extends BRepBuilderAPI_MakeSolid {
    constructor(S1: TopoDS_Shell, S2: TopoDS_Shell);
  }

  export declare class BRepBuilderAPI_MakeSolid_5 extends BRepBuilderAPI_MakeSolid {
    constructor(S1: TopoDS_Shell, S2: TopoDS_Shell, S3: TopoDS_Shell);
  }

  export declare class BRepBuilderAPI_MakeSolid_6 extends BRepBuilderAPI_MakeSolid {
    constructor(So: TopoDS_Solid);
  }

  export declare class BRepBuilderAPI_MakeSolid_7 extends BRepBuilderAPI_MakeSolid {
    constructor(So: TopoDS_Solid, S: TopoDS_Shell);
  }

export declare class BRepBuilderAPI_Sewing extends Standard_Transient {
  constructor(tolerance: Standard_Real, option1: Standard_Boolean, option2: Standard_Boolean, option3: Standard_Boolean, option4: Standard_Boolean)
  Init(tolerance: Standard_Real, option1: Standard_Boolean, option2: Standard_Boolean, option3: Standard_Boolean, option4: Standard_Boolean): void;
  Load(shape: TopoDS_Shape): void;
  Add(shape: TopoDS_Shape): void;
  Perform(theProgress: Message_ProgressRange): void;
  SewedShape(): TopoDS_Shape;
  SetContext(theContext: Handle_BRepTools_ReShape): void;
  GetContext(): Handle_BRepTools_ReShape;
  NbFreeEdges(): Graphic3d_ZLayerId;
  FreeEdge(index: Graphic3d_ZLayerId): TopoDS_Edge;
  NbMultipleEdges(): Graphic3d_ZLayerId;
  MultipleEdge(index: Graphic3d_ZLayerId): TopoDS_Edge;
  NbContigousEdges(): Graphic3d_ZLayerId;
  ContigousEdge(index: Graphic3d_ZLayerId): TopoDS_Edge;
  ContigousEdgeCouple(index: Graphic3d_ZLayerId): TopTools_ListOfShape;
  IsSectionBound(section: TopoDS_Edge): Standard_Boolean;
  SectionToBoundary(section: TopoDS_Edge): TopoDS_Edge;
  NbDegeneratedShapes(): Graphic3d_ZLayerId;
  DegeneratedShape(index: Graphic3d_ZLayerId): TopoDS_Shape;
  IsDegenerated(shape: TopoDS_Shape): Standard_Boolean;
  IsModified(shape: TopoDS_Shape): Standard_Boolean;
  Modified(shape: TopoDS_Shape): TopoDS_Shape;
  IsModifiedSubShape(shape: TopoDS_Shape): Standard_Boolean;
  ModifiedSubShape(shape: TopoDS_Shape): TopoDS_Shape;
  Dump(): void;
  NbDeletedFaces(): Graphic3d_ZLayerId;
  DeletedFace(index: Graphic3d_ZLayerId): TopoDS_Face;
  WhichFace(theEdg: TopoDS_Edge, index: Graphic3d_ZLayerId): TopoDS_Face;
  SameParameterMode(): Standard_Boolean;
  SetSameParameterMode(SameParameterMode: Standard_Boolean): void;
  Tolerance(): Standard_Real;
  SetTolerance(theToler: Standard_Real): void;
  MinTolerance(): Standard_Real;
  SetMinTolerance(theMinToler: Standard_Real): void;
  MaxTolerance(): Standard_Real;
  SetMaxTolerance(theMaxToler: Standard_Real): void;
  FaceMode(): Standard_Boolean;
  SetFaceMode(theFaceMode: Standard_Boolean): void;
  FloatingEdgesMode(): Standard_Boolean;
  SetFloatingEdgesMode(theFloatingEdgesMode: Standard_Boolean): void;
  LocalTolerancesMode(): Standard_Boolean;
  SetLocalTolerancesMode(theLocalTolerancesMode: Standard_Boolean): void;
  SetNonManifoldMode(theNonManifoldMode: Standard_Boolean): void;
  NonManifoldMode(): Standard_Boolean;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare type BRepBuilderAPI_TransitionMode = {
  BRepBuilderAPI_Transformed: {};
  BRepBuilderAPI_RightCorner: {};
  BRepBuilderAPI_RoundCorner: {};
}

export declare class BRepBuilderAPI_MakeVertex extends BRepBuilderAPI_MakeShape {
  constructor(P: gp_Pnt)
  Vertex(): TopoDS_Vertex;
  delete(): void;
}

export declare class BRepBuilderAPI_MakeFace extends BRepBuilderAPI_MakeShape {
  Init_1(F: TopoDS_Face): void;
  Init_2(S: Handle_Geom_Surface, Bound: Standard_Boolean, TolDegen: Standard_Real): void;
  Init_3(S: Handle_Geom_Surface, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real, TolDegen: Standard_Real): void;
  Add(W: TopoDS_Wire): void;
  IsDone(): Standard_Boolean;
  Error(): BRepBuilderAPI_FaceError;
  Face(): TopoDS_Face;
  delete(): void;
}

  export declare class BRepBuilderAPI_MakeFace_1 extends BRepBuilderAPI_MakeFace {
    constructor();
  }

  export declare class BRepBuilderAPI_MakeFace_2 extends BRepBuilderAPI_MakeFace {
    constructor(F: TopoDS_Face);
  }

  export declare class BRepBuilderAPI_MakeFace_3 extends BRepBuilderAPI_MakeFace {
    constructor(P: gp_Pln);
  }

  export declare class BRepBuilderAPI_MakeFace_4 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cylinder);
  }

  export declare class BRepBuilderAPI_MakeFace_5 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cone);
  }

  export declare class BRepBuilderAPI_MakeFace_6 extends BRepBuilderAPI_MakeFace {
    constructor(S: gp_Sphere);
  }

  export declare class BRepBuilderAPI_MakeFace_7 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Torus);
  }

  export declare class BRepBuilderAPI_MakeFace_8 extends BRepBuilderAPI_MakeFace {
    constructor(S: Handle_Geom_Surface, TolDegen: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_9 extends BRepBuilderAPI_MakeFace {
    constructor(P: gp_Pln, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_10 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cylinder, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_11 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cone, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_12 extends BRepBuilderAPI_MakeFace {
    constructor(S: gp_Sphere, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_13 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Torus, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_14 extends BRepBuilderAPI_MakeFace {
    constructor(S: Handle_Geom_Surface, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real, TolDegen: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeFace_15 extends BRepBuilderAPI_MakeFace {
    constructor(W: TopoDS_Wire, OnlyPlane: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_16 extends BRepBuilderAPI_MakeFace {
    constructor(P: gp_Pln, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_17 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cylinder, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_18 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Cone, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_19 extends BRepBuilderAPI_MakeFace {
    constructor(S: gp_Sphere, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_20 extends BRepBuilderAPI_MakeFace {
    constructor(C: gp_Torus, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_21 extends BRepBuilderAPI_MakeFace {
    constructor(S: Handle_Geom_Surface, W: TopoDS_Wire, Inside: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeFace_22 extends BRepBuilderAPI_MakeFace {
    constructor(F: TopoDS_Face, W: TopoDS_Wire);
  }

export declare class BRepBuilderAPI_MakeWire extends BRepBuilderAPI_MakeShape {
  Add_1(E: TopoDS_Edge): void;
  Add_2(W: TopoDS_Wire): void;
  Add_3(L: TopTools_ListOfShape): void;
  IsDone(): Standard_Boolean;
  Error(): BRepBuilderAPI_WireError;
  Wire(): TopoDS_Wire;
  Edge(): TopoDS_Edge;
  Vertex(): TopoDS_Vertex;
  delete(): void;
}

  export declare class BRepBuilderAPI_MakeWire_1 extends BRepBuilderAPI_MakeWire {
    constructor();
  }

  export declare class BRepBuilderAPI_MakeWire_2 extends BRepBuilderAPI_MakeWire {
    constructor(E: TopoDS_Edge);
  }

  export declare class BRepBuilderAPI_MakeWire_3 extends BRepBuilderAPI_MakeWire {
    constructor(E1: TopoDS_Edge, E2: TopoDS_Edge);
  }

  export declare class BRepBuilderAPI_MakeWire_4 extends BRepBuilderAPI_MakeWire {
    constructor(E1: TopoDS_Edge, E2: TopoDS_Edge, E3: TopoDS_Edge);
  }

  export declare class BRepBuilderAPI_MakeWire_5 extends BRepBuilderAPI_MakeWire {
    constructor(E1: TopoDS_Edge, E2: TopoDS_Edge, E3: TopoDS_Edge, E4: TopoDS_Edge);
  }

  export declare class BRepBuilderAPI_MakeWire_6 extends BRepBuilderAPI_MakeWire {
    constructor(W: TopoDS_Wire);
  }

  export declare class BRepBuilderAPI_MakeWire_7 extends BRepBuilderAPI_MakeWire {
    constructor(W: TopoDS_Wire, E: TopoDS_Edge);
  }

export declare class BRepBuilderAPI_MakeEdge extends BRepBuilderAPI_MakeShape {
  Init_1(C: Handle_Geom_Curve): void;
  Init_2(C: Handle_Geom_Curve, p1: Standard_Real, p2: Standard_Real): void;
  Init_3(C: Handle_Geom_Curve, P1: gp_Pnt, P2: gp_Pnt): void;
  Init_4(C: Handle_Geom_Curve, V1: TopoDS_Vertex, V2: TopoDS_Vertex): void;
  Init_5(C: Handle_Geom_Curve, P1: gp_Pnt, P2: gp_Pnt, p1: Standard_Real, p2: Standard_Real): void;
  Init_6(C: Handle_Geom_Curve, V1: TopoDS_Vertex, V2: TopoDS_Vertex, p1: Standard_Real, p2: Standard_Real): void;
  Init_7(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface): void;
  Init_8(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, p1: Standard_Real, p2: Standard_Real): void;
  Init_9(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, P1: gp_Pnt, P2: gp_Pnt): void;
  Init_10(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, V1: TopoDS_Vertex, V2: TopoDS_Vertex): void;
  Init_11(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, P1: gp_Pnt, P2: gp_Pnt, p1: Standard_Real, p2: Standard_Real): void;
  Init_12(C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, V1: TopoDS_Vertex, V2: TopoDS_Vertex, p1: Standard_Real, p2: Standard_Real): void;
  IsDone(): Standard_Boolean;
  Error(): BRepBuilderAPI_EdgeError;
  Edge(): TopoDS_Edge;
  Vertex1(): TopoDS_Vertex;
  Vertex2(): TopoDS_Vertex;
  delete(): void;
}

  export declare class BRepBuilderAPI_MakeEdge_1 extends BRepBuilderAPI_MakeEdge {
    constructor();
  }

  export declare class BRepBuilderAPI_MakeEdge_2 extends BRepBuilderAPI_MakeEdge {
    constructor(V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_3 extends BRepBuilderAPI_MakeEdge {
    constructor(P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_4 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Lin);
  }

  export declare class BRepBuilderAPI_MakeEdge_5 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Lin, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_6 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Lin, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_7 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Lin, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_8 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Circ);
  }

  export declare class BRepBuilderAPI_MakeEdge_9 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Circ, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_10 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Circ, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_11 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Circ, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_12 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Elips);
  }

  export declare class BRepBuilderAPI_MakeEdge_13 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Elips, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_14 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Elips, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_15 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Elips, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_16 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Hypr);
  }

  export declare class BRepBuilderAPI_MakeEdge_17 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Hypr, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_18 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Hypr, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_19 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Hypr, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_20 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Parab);
  }

  export declare class BRepBuilderAPI_MakeEdge_21 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Parab, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_22 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Parab, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_23 extends BRepBuilderAPI_MakeEdge {
    constructor(L: gp_Parab, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_24 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve);
  }

  export declare class BRepBuilderAPI_MakeEdge_25 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_26 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_27 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_28 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve, P1: gp_Pnt, P2: gp_Pnt, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_29 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom_Curve, V1: TopoDS_Vertex, V2: TopoDS_Vertex, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_30 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface);
  }

  export declare class BRepBuilderAPI_MakeEdge_31 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_32 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface, P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepBuilderAPI_MakeEdge_33 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface, V1: TopoDS_Vertex, V2: TopoDS_Vertex);
  }

  export declare class BRepBuilderAPI_MakeEdge_34 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface, P1: gp_Pnt, P2: gp_Pnt, p1: Standard_Real, p2: Standard_Real);
  }

  export declare class BRepBuilderAPI_MakeEdge_35 extends BRepBuilderAPI_MakeEdge {
    constructor(L: Handle_Geom2d_Curve, S: Handle_Geom_Surface, V1: TopoDS_Vertex, V2: TopoDS_Vertex, p1: Standard_Real, p2: Standard_Real);
  }

export declare class BRepBuilderAPI_Command {
  IsDone(): Standard_Boolean;
  Check(): void;
  delete(): void;
}

export declare class BRepBuilderAPI_MakeShell extends BRepBuilderAPI_MakeShape {
  Init(S: Handle_Geom_Surface, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real, Segment: Standard_Boolean): void;
  IsDone(): Standard_Boolean;
  Error(): BRepBuilderAPI_ShellError;
  Shell(): TopoDS_Shell;
  delete(): void;
}

  export declare class BRepBuilderAPI_MakeShell_1 extends BRepBuilderAPI_MakeShell {
    constructor();
  }

  export declare class BRepBuilderAPI_MakeShell_2 extends BRepBuilderAPI_MakeShell {
    constructor(S: Handle_Geom_Surface, Segment: Standard_Boolean);
  }

  export declare class BRepBuilderAPI_MakeShell_3 extends BRepBuilderAPI_MakeShell {
    constructor(S: Handle_Geom_Surface, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real, Segment: Standard_Boolean);
  }

export declare class BRepBuilderAPI_Copy extends BRepBuilderAPI_ModifyShape {
  Perform(S: TopoDS_Shape, copyGeom: Standard_Boolean, copyMesh: Standard_Boolean): void;
  delete(): void;
}

  export declare class BRepBuilderAPI_Copy_1 extends BRepBuilderAPI_Copy {
    constructor();
  }

  export declare class BRepBuilderAPI_Copy_2 extends BRepBuilderAPI_Copy {
    constructor(S: TopoDS_Shape, copyGeom: Standard_Boolean, copyMesh: Standard_Boolean);
  }

export declare class BRep_Builder extends TopoDS_Builder {
  constructor();
  MakeFace_1(F: TopoDS_Face): void;
  MakeFace_2(F: TopoDS_Face, S: Handle_Geom_Surface, Tol: Standard_Real): void;
  MakeFace_3(F: TopoDS_Face, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real): void;
  MakeFace_4(theFace: TopoDS_Face, theTriangulation: Handle_Poly_Triangulation): void;
  MakeFace_5(theFace: TopoDS_Face, theTriangulations: Poly_ListOfTriangulation, theActiveTriangulation: Handle_Poly_Triangulation): void;
  UpdateFace_1(F: TopoDS_Face, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real): void;
  UpdateFace_2(theFace: TopoDS_Face, theTriangulation: Handle_Poly_Triangulation, theToReset: Standard_Boolean): void;
  UpdateFace_3(F: TopoDS_Face, Tol: Standard_Real): void;
  NaturalRestriction(F: TopoDS_Face, N: Standard_Boolean): void;
  MakeEdge_1(E: TopoDS_Edge): void;
  MakeEdge_2(E: TopoDS_Edge, C: Handle_Geom_Curve, Tol: Standard_Real): void;
  MakeEdge_3(E: TopoDS_Edge, C: Handle_Geom_Curve, L: TopLoc_Location, Tol: Standard_Real): void;
  MakeEdge_4(E: TopoDS_Edge, P: Handle_Poly_Polygon3D): void;
  MakeEdge_5(E: TopoDS_Edge, N: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation): void;
  MakeEdge_6(E: TopoDS_Edge, N: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation, L: TopLoc_Location): void;
  UpdateEdge_1(E: TopoDS_Edge, C: Handle_Geom_Curve, Tol: Standard_Real): void;
  UpdateEdge_2(E: TopoDS_Edge, C: Handle_Geom_Curve, L: TopLoc_Location, Tol: Standard_Real): void;
  UpdateEdge_3(E: TopoDS_Edge, C: Handle_Geom2d_Curve, F: TopoDS_Face, Tol: Standard_Real): void;
  UpdateEdge_4(E: TopoDS_Edge, C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, F: TopoDS_Face, Tol: Standard_Real): void;
  UpdateEdge_5(E: TopoDS_Edge, C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real): void;
  UpdateEdge_6(E: TopoDS_Edge, C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real, Pf: gp_Pnt2d, Pl: gp_Pnt2d): void;
  UpdateEdge_7(E: TopoDS_Edge, C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real): void;
  UpdateEdge_8(E: TopoDS_Edge, C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real, Pf: gp_Pnt2d, Pl: gp_Pnt2d): void;
  UpdateEdge_9(E: TopoDS_Edge, P: Handle_Poly_Polygon3D): void;
  UpdateEdge_10(E: TopoDS_Edge, P: Handle_Poly_Polygon3D, L: TopLoc_Location): void;
  UpdateEdge_11(E: TopoDS_Edge, N: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation): void;
  UpdateEdge_12(E: TopoDS_Edge, N: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation, L: TopLoc_Location): void;
  UpdateEdge_13(E: TopoDS_Edge, N1: Handle_Poly_PolygonOnTriangulation, N2: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation): void;
  UpdateEdge_14(E: TopoDS_Edge, N1: Handle_Poly_PolygonOnTriangulation, N2: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation, L: TopLoc_Location): void;
  UpdateEdge_15(E: TopoDS_Edge, P: Handle_Poly_Polygon2D, S: TopoDS_Face): void;
  UpdateEdge_16(E: TopoDS_Edge, P: Handle_Poly_Polygon2D, S: Handle_Geom_Surface, T: TopLoc_Location): void;
  UpdateEdge_17(E: TopoDS_Edge, P1: Handle_Poly_Polygon2D, P2: Handle_Poly_Polygon2D, S: TopoDS_Face): void;
  UpdateEdge_18(E: TopoDS_Edge, P1: Handle_Poly_Polygon2D, P2: Handle_Poly_Polygon2D, S: Handle_Geom_Surface, L: TopLoc_Location): void;
  UpdateEdge_19(E: TopoDS_Edge, Tol: Standard_Real): void;
  Continuity_1(E: TopoDS_Edge, F1: TopoDS_Face, F2: TopoDS_Face, C: GeomAbs_Shape): void;
  Continuity_2(E: TopoDS_Edge, S1: Handle_Geom_Surface, S2: Handle_Geom_Surface, L1: TopLoc_Location, L2: TopLoc_Location, C: GeomAbs_Shape): void;
  SameParameter(E: TopoDS_Edge, S: Standard_Boolean): void;
  SameRange(E: TopoDS_Edge, S: Standard_Boolean): void;
  Degenerated(E: TopoDS_Edge, D: Standard_Boolean): void;
  Range_1(E: TopoDS_Edge, First: Standard_Real, Last: Standard_Real, Only3d: Standard_Boolean): void;
  Range_2(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real): void;
  Range_3(E: TopoDS_Edge, F: TopoDS_Face, First: Standard_Real, Last: Standard_Real): void;
  Transfert_1(Ein: TopoDS_Edge, Eout: TopoDS_Edge): void;
  MakeVertex_1(V: TopoDS_Vertex): void;
  MakeVertex_2(V: TopoDS_Vertex, P: gp_Pnt, Tol: Standard_Real): void;
  UpdateVertex_1(V: TopoDS_Vertex, P: gp_Pnt, Tol: Standard_Real): void;
  UpdateVertex_2(V: TopoDS_Vertex, P: Standard_Real, E: TopoDS_Edge, Tol: Standard_Real): void;
  UpdateVertex_3(V: TopoDS_Vertex, P: Standard_Real, E: TopoDS_Edge, F: TopoDS_Face, Tol: Standard_Real): void;
  UpdateVertex_4(V: TopoDS_Vertex, P: Standard_Real, E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, Tol: Standard_Real): void;
  UpdateVertex_5(Ve: TopoDS_Vertex, U: Standard_Real, V: Standard_Real, F: TopoDS_Face, Tol: Standard_Real): void;
  UpdateVertex_6(V: TopoDS_Vertex, Tol: Standard_Real): void;
  Transfert_2(Ein: TopoDS_Edge, Eout: TopoDS_Edge, Vin: TopoDS_Vertex, Vout: TopoDS_Vertex): void;
  delete(): void;
}

export declare class BRep_Tool {
  constructor();
  static IsClosed_1(S: TopoDS_Shape): Standard_Boolean;
  static Surface_1(F: TopoDS_Face, L: TopLoc_Location): Handle_Geom_Surface;
  static Surface_2(F: TopoDS_Face): Handle_Geom_Surface;
  static Triangulation(theFace: TopoDS_Face, theLocation: TopLoc_Location, theMeshPurpose: Poly_MeshPurpose): Handle_Poly_Triangulation;
  static Triangulations(theFace: TopoDS_Face, theLocation: TopLoc_Location): Poly_ListOfTriangulation;
  static Tolerance_1(F: TopoDS_Face): Standard_Real;
  static NaturalRestriction(F: TopoDS_Face): Standard_Boolean;
  static IsGeometric_1(F: TopoDS_Face): Standard_Boolean;
  static IsGeometric_2(E: TopoDS_Edge): Standard_Boolean;
  static Curve_1(E: TopoDS_Edge, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real): Handle_Geom_Curve;
  static Curve_2(E: TopoDS_Edge, First: Standard_Real, Last: Standard_Real): Handle_Geom_Curve;
  static Polygon3D(E: TopoDS_Edge, L: TopLoc_Location): Handle_Poly_Polygon3D;
  static CurveOnSurface_1(E: TopoDS_Edge, F: TopoDS_Face, First: Standard_Real, Last: Standard_Real, theIsStored: Standard_Boolean): Handle_Geom2d_Curve;
  static CurveOnSurface_2(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real, theIsStored: Standard_Boolean): Handle_Geom2d_Curve;
  static CurveOnPlane(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real): Handle_Geom2d_Curve;
  static CurveOnSurface_3(E: TopoDS_Edge, C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real): void;
  static CurveOnSurface_4(E: TopoDS_Edge, C: Handle_Geom2d_Curve, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real, Index: Graphic3d_ZLayerId): void;
  static PolygonOnSurface_1(E: TopoDS_Edge, F: TopoDS_Face): Handle_Poly_Polygon2D;
  static PolygonOnSurface_2(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location): Handle_Poly_Polygon2D;
  static PolygonOnSurface_3(E: TopoDS_Edge, C: Handle_Poly_Polygon2D, S: Handle_Geom_Surface, L: TopLoc_Location): void;
  static PolygonOnSurface_4(E: TopoDS_Edge, C: Handle_Poly_Polygon2D, S: Handle_Geom_Surface, L: TopLoc_Location, Index: Graphic3d_ZLayerId): void;
  static PolygonOnTriangulation_1(E: TopoDS_Edge, T: Handle_Poly_Triangulation, L: TopLoc_Location): Handle_Poly_PolygonOnTriangulation;
  static PolygonOnTriangulation_2(E: TopoDS_Edge, P: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation, L: TopLoc_Location): void;
  static PolygonOnTriangulation_3(E: TopoDS_Edge, P: Handle_Poly_PolygonOnTriangulation, T: Handle_Poly_Triangulation, L: TopLoc_Location, Index: Graphic3d_ZLayerId): void;
  static IsClosed_2(E: TopoDS_Edge, F: TopoDS_Face): Standard_Boolean;
  static IsClosed_3(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location): Standard_Boolean;
  static IsClosed_4(E: TopoDS_Edge, T: Handle_Poly_Triangulation, L: TopLoc_Location): Standard_Boolean;
  static Tolerance_2(E: TopoDS_Edge): Standard_Real;
  static SameParameter(E: TopoDS_Edge): Standard_Boolean;
  static SameRange(E: TopoDS_Edge): Standard_Boolean;
  static Degenerated(E: TopoDS_Edge): Standard_Boolean;
  static Range_1(E: TopoDS_Edge, First: Standard_Real, Last: Standard_Real): void;
  static Range_2(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, First: Standard_Real, Last: Standard_Real): void;
  static Range_3(E: TopoDS_Edge, F: TopoDS_Face, First: Standard_Real, Last: Standard_Real): void;
  static UVPoints_1(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, PFirst: gp_Pnt2d, PLast: gp_Pnt2d): void;
  static UVPoints_2(E: TopoDS_Edge, F: TopoDS_Face, PFirst: gp_Pnt2d, PLast: gp_Pnt2d): void;
  static SetUVPoints_1(E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location, PFirst: gp_Pnt2d, PLast: gp_Pnt2d): void;
  static SetUVPoints_2(E: TopoDS_Edge, F: TopoDS_Face, PFirst: gp_Pnt2d, PLast: gp_Pnt2d): void;
  static HasContinuity_1(E: TopoDS_Edge, F1: TopoDS_Face, F2: TopoDS_Face): Standard_Boolean;
  static Continuity_1(E: TopoDS_Edge, F1: TopoDS_Face, F2: TopoDS_Face): GeomAbs_Shape;
  static HasContinuity_2(E: TopoDS_Edge, S1: Handle_Geom_Surface, S2: Handle_Geom_Surface, L1: TopLoc_Location, L2: TopLoc_Location): Standard_Boolean;
  static Continuity_2(E: TopoDS_Edge, S1: Handle_Geom_Surface, S2: Handle_Geom_Surface, L1: TopLoc_Location, L2: TopLoc_Location): GeomAbs_Shape;
  static HasContinuity_3(E: TopoDS_Edge): Standard_Boolean;
  static MaxContinuity(theEdge: TopoDS_Edge): GeomAbs_Shape;
  static Pnt(V: TopoDS_Vertex): gp_Pnt;
  static Tolerance_3(V: TopoDS_Vertex): Standard_Real;
  static Parameter_1(theV: TopoDS_Vertex, theE: TopoDS_Edge, theParam: Standard_Real): Standard_Boolean;
  static Parameter_2(V: TopoDS_Vertex, E: TopoDS_Edge): Standard_Real;
  static Parameter_3(V: TopoDS_Vertex, E: TopoDS_Edge, F: TopoDS_Face): Standard_Real;
  static Parameter_4(V: TopoDS_Vertex, E: TopoDS_Edge, S: Handle_Geom_Surface, L: TopLoc_Location): Standard_Real;
  static Parameters(V: TopoDS_Vertex, F: TopoDS_Face): gp_Pnt2d;
  static MaxTolerance(theShape: TopoDS_Shape, theSubShape: TopAbs_ShapeEnum): Standard_Real;
  delete(): void;
}

export declare class GC_MakeArcOfCircle extends GC_Root {
  Value(): Handle_Geom_TrimmedCurve;
  delete(): void;
}

  export declare class GC_MakeArcOfCircle_1 extends GC_MakeArcOfCircle {
    constructor(Circ: gp_Circ, Alpha1: Standard_Real, Alpha2: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GC_MakeArcOfCircle_2 extends GC_MakeArcOfCircle {
    constructor(Circ: gp_Circ, P: gp_Pnt, Alpha: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GC_MakeArcOfCircle_3 extends GC_MakeArcOfCircle {
    constructor(Circ: gp_Circ, P1: gp_Pnt, P2: gp_Pnt, Sense: Standard_Boolean);
  }

  export declare class GC_MakeArcOfCircle_4 extends GC_MakeArcOfCircle {
    constructor(P1: gp_Pnt, P2: gp_Pnt, P3: gp_Pnt);
  }

  export declare class GC_MakeArcOfCircle_5 extends GC_MakeArcOfCircle {
    constructor(P1: gp_Pnt, V: gp_Vec, P2: gp_Pnt);
  }

export declare class GC_MakeArcOfEllipse extends GC_Root {
  Value(): Handle_Geom_TrimmedCurve;
  delete(): void;
}

  export declare class GC_MakeArcOfEllipse_1 extends GC_MakeArcOfEllipse {
    constructor(Elips: gp_Elips, Alpha1: Standard_Real, Alpha2: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GC_MakeArcOfEllipse_2 extends GC_MakeArcOfEllipse {
    constructor(Elips: gp_Elips, P: gp_Pnt, Alpha: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GC_MakeArcOfEllipse_3 extends GC_MakeArcOfEllipse {
    constructor(Elips: gp_Elips, P1: gp_Pnt, P2: gp_Pnt, Sense: Standard_Boolean);
  }

export declare class GC_Root {
  constructor();
  IsDone(): Standard_Boolean;
  Status(): gce_ErrorType;
  delete(): void;
}

export declare type GeomAbs_CurveType = {
  GeomAbs_Line: {};
  GeomAbs_Circle: {};
  GeomAbs_Ellipse: {};
  GeomAbs_Hyperbola: {};
  GeomAbs_Parabola: {};
  GeomAbs_BezierCurve: {};
  GeomAbs_BSplineCurve: {};
  GeomAbs_OffsetCurve: {};
  GeomAbs_OtherCurve: {};
}

export declare type GeomAbs_JoinType = {
  GeomAbs_Arc: {};
  GeomAbs_Tangent: {};
  GeomAbs_Intersection: {};
}

export declare type GeomAbs_Shape = {
  GeomAbs_C0: {};
  GeomAbs_G1: {};
  GeomAbs_C1: {};
  GeomAbs_G2: {};
  GeomAbs_C2: {};
  GeomAbs_C3: {};
  GeomAbs_CN: {};
}

export declare type GeomAbs_SurfaceType = {
  GeomAbs_Plane: {};
  GeomAbs_Cylinder: {};
  GeomAbs_Cone: {};
  GeomAbs_Sphere: {};
  GeomAbs_Torus: {};
  GeomAbs_BezierSurface: {};
  GeomAbs_BSplineSurface: {};
  GeomAbs_SurfaceOfRevolution: {};
  GeomAbs_SurfaceOfExtrusion: {};
  GeomAbs_OffsetSurface: {};
  GeomAbs_OtherSurface: {};
}

export declare type ChFiDS_ChamfMode = {
  ChFiDS_ClassicChamfer: {};
  ChFiDS_ConstThroatChamfer: {};
  ChFiDS_ConstThroatWithPenetrationChamfer: {};
}

export declare type ChFi3d_FilletShape = {
  ChFi3d_Rational: {};
  ChFi3d_QuasiAngular: {};
  ChFi3d_Polynomial: {};
}

export declare class BndLib_Add2dCurve {
  constructor();
  static Add_1(C: Adaptor2d_Curve2d, Tol: Standard_Real, B: Bnd_Box2d): void;
  static Add_2(C: Adaptor2d_Curve2d, U1: Standard_Real, U2: Standard_Real, Tol: Standard_Real, B: Bnd_Box2d): void;
  static Add_3(C: Handle_Geom2d_Curve, Tol: Standard_Real, Box: Bnd_Box2d): void;
  static Add_4(C: Handle_Geom2d_Curve, U1: Standard_Real, U2: Standard_Real, Tol: Standard_Real, B: Bnd_Box2d): void;
  static AddOptimal(C: Handle_Geom2d_Curve, U1: Standard_Real, U2: Standard_Real, Tol: Standard_Real, B: Bnd_Box2d): void;
  delete(): void;
}

export declare class gp_Ax3 {
  XReverse(): void;
  YReverse(): void;
  ZReverse(): void;
  SetAxis(theA1: gp_Ax1): void;
  SetDirection(theV: gp_Dir): void;
  SetLocation(theP: gp_Pnt): void;
  SetXDirection(theVx: gp_Dir): void;
  SetYDirection(theVy: gp_Dir): void;
  Angle(theOther: gp_Ax3): Standard_Real;
  Axis(): gp_Ax1;
  Ax2(): gp_Ax2;
  Direction(): gp_Dir;
  Location(): gp_Pnt;
  XDirection(): gp_Dir;
  YDirection(): gp_Dir;
  Direct(): Standard_Boolean;
  IsCoplanar_1(theOther: gp_Ax3, theLinearTolerance: Standard_Real, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsCoplanar_2(theA1: gp_Ax1, theLinearTolerance: Standard_Real, theAngularTolerance: Standard_Real): Standard_Boolean;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Ax3;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Ax3;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Ax3;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Ax3;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Ax3;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Ax3;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Ax3;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Ax3;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Ax3_1 extends gp_Ax3 {
    constructor();
  }

  export declare class gp_Ax3_2 extends gp_Ax3 {
    constructor(theA: gp_Ax2);
  }

  export declare class gp_Ax3_3 extends gp_Ax3 {
    constructor(theP: gp_Pnt, theN: gp_Dir, theVx: gp_Dir);
  }

  export declare class gp_Ax3_4 extends gp_Ax3 {
    constructor(theP: gp_Pnt, theV: gp_Dir);
  }

export declare class gp_Dir2d {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXv: Standard_Real, theYv: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetXY(theCoord: gp_XY): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXv: Standard_Real, theYv: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  XY(): gp_XY;
  IsEqual(theOther: gp_Dir2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Dir2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Dir2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Dir2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Dir2d): Standard_Real;
  Crossed(theRight: gp_Dir2d): Standard_Real;
  Dot(theOther: gp_Dir2d): Standard_Real;
  Reverse(): void;
  Reversed(): gp_Dir2d;
  Mirror_1(theV: gp_Dir2d): void;
  Mirrored_1(theV: gp_Dir2d): gp_Dir2d;
  Mirror_2(theA: gp_Ax2d): void;
  Mirrored_2(theA: gp_Ax2d): gp_Dir2d;
  Rotate(Ang: Standard_Real): void;
  Rotated(theAng: Standard_Real): gp_Dir2d;
  Transform(theT: gp_Trsf2d): void;
  Transformed(theT: gp_Trsf2d): gp_Dir2d;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_Dir2d_1 extends gp_Dir2d {
    constructor();
  }

  export declare class gp_Dir2d_2 extends gp_Dir2d {
    constructor(theV: gp_Vec2d);
  }

  export declare class gp_Dir2d_3 extends gp_Dir2d {
    constructor(theCoord: gp_XY);
  }

  export declare class gp_Dir2d_4 extends gp_Dir2d {
    constructor(theXv: Standard_Real, theYv: Standard_Real);
  }

export declare class gp_GTrsf2d {
  SetAffinity(theA: gp_Ax2d, theRatio: Standard_Real): void;
  SetValue(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId, theValue: Standard_Real): void;
  SetTranslationPart(theCoord: gp_XY): void;
  SetTrsf2d(theT: gp_Trsf2d): void;
  SetVectorialPart(theMatrix: gp_Mat2d): void;
  IsNegative(): Standard_Boolean;
  IsSingular(): Standard_Boolean;
  Form(): gp_TrsfForm;
  TranslationPart(): gp_XY;
  VectorialPart(): gp_Mat2d;
  Value(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId): Standard_Real;
  Invert(): void;
  Inverted(): gp_GTrsf2d;
  Multiplied(theT: gp_GTrsf2d): gp_GTrsf2d;
  Multiply(theT: gp_GTrsf2d): void;
  PreMultiply(theT: gp_GTrsf2d): void;
  Power(theN: Graphic3d_ZLayerId): void;
  Powered(theN: Graphic3d_ZLayerId): gp_GTrsf2d;
  Transforms_1(theCoord: gp_XY): void;
  Transformed(theCoord: gp_XY): gp_XY;
  Transforms_2(theX: Standard_Real, theY: Standard_Real): void;
  Trsf2d(): gp_Trsf2d;
  delete(): void;
}

  export declare class gp_GTrsf2d_1 extends gp_GTrsf2d {
    constructor();
  }

  export declare class gp_GTrsf2d_2 extends gp_GTrsf2d {
    constructor(theT: gp_Trsf2d);
  }

  export declare class gp_GTrsf2d_3 extends gp_GTrsf2d {
    constructor(theM: gp_Mat2d, theV: gp_XY);
  }

export declare class gp_Pln {
  Coefficients(theA: Standard_Real, theB: Standard_Real, theC: Standard_Real, theD: Standard_Real): void;
  SetAxis(theA1: gp_Ax1): void;
  SetLocation(theLoc: gp_Pnt): void;
  SetPosition(theA3: gp_Ax3): void;
  UReverse(): void;
  VReverse(): void;
  Direct(): Standard_Boolean;
  Axis(): gp_Ax1;
  Location(): gp_Pnt;
  Position(): gp_Ax3;
  Distance_1(theP: gp_Pnt): Standard_Real;
  Distance_2(theL: gp_Lin): Standard_Real;
  Distance_3(theOther: gp_Pln): Standard_Real;
  SquareDistance_1(theP: gp_Pnt): Standard_Real;
  SquareDistance_2(theL: gp_Lin): Standard_Real;
  SquareDistance_3(theOther: gp_Pln): Standard_Real;
  XAxis(): gp_Ax1;
  YAxis(): gp_Ax1;
  Contains_1(theP: gp_Pnt, theLinearTolerance: Standard_Real): Standard_Boolean;
  Contains_2(theL: gp_Lin, theLinearTolerance: Standard_Real, theAngularTolerance: Standard_Real): Standard_Boolean;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Pln;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Pln;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Pln;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Pln;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Pln;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Pln;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Pln;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Pln;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_Pln_1 extends gp_Pln {
    constructor();
  }

  export declare class gp_Pln_2 extends gp_Pln {
    constructor(theA3: gp_Ax3);
  }

  export declare class gp_Pln_3 extends gp_Pln {
    constructor(theP: gp_Pnt, theV: gp_Dir);
  }

  export declare class gp_Pln_4 extends gp_Pln {
    constructor(theA: Standard_Real, theB: Standard_Real, theC: Standard_Real, theD: Standard_Real);
  }

export declare class gp_Trsf2d {
  SetMirror_1(theP: gp_Pnt2d): void;
  SetMirror_2(theA: gp_Ax2d): void;
  SetRotation(theP: gp_Pnt2d, theAng: Standard_Real): void;
  SetScale(theP: gp_Pnt2d, theS: Standard_Real): void;
  SetTransformation_1(theFromSystem1: gp_Ax2d, theToSystem2: gp_Ax2d): void;
  SetTransformation_2(theToSystem: gp_Ax2d): void;
  SetTranslation_1(theV: gp_Vec2d): void;
  SetTranslation_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): void;
  SetTranslationPart(theV: gp_Vec2d): void;
  SetScaleFactor(theS: Standard_Real): void;
  IsNegative(): Standard_Boolean;
  Form(): gp_TrsfForm;
  ScaleFactor(): Standard_Real;
  TranslationPart(): gp_XY;
  VectorialPart(): gp_Mat2d;
  HVectorialPart(): gp_Mat2d;
  RotationPart(): Standard_Real;
  Value(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId): Standard_Real;
  Invert(): void;
  Inverted(): gp_Trsf2d;
  Multiplied(theT: gp_Trsf2d): gp_Trsf2d;
  Multiply(theT: gp_Trsf2d): void;
  PreMultiply(theT: gp_Trsf2d): void;
  Power(theN: Graphic3d_ZLayerId): void;
  Powered(theN: Graphic3d_ZLayerId): gp_Trsf2d;
  Transforms_1(theX: Standard_Real, theY: Standard_Real): void;
  Transforms_2(theCoord: gp_XY): void;
  SetValues(a11: Standard_Real, a12: Standard_Real, a13: Standard_Real, a21: Standard_Real, a22: Standard_Real, a23: Standard_Real): void;
  delete(): void;
}

  export declare class gp_Trsf2d_1 extends gp_Trsf2d {
    constructor();
  }

  export declare class gp_Trsf2d_2 extends gp_Trsf2d {
    constructor(theT: gp_Trsf);
  }

export declare class gp_Elips {
  SetAxis(theA1: gp_Ax1): void;
  SetLocation(theP: gp_Pnt): void;
  SetMajorRadius(theMajorRadius: Standard_Real): void;
  SetMinorRadius(theMinorRadius: Standard_Real): void;
  SetPosition(theA2: gp_Ax2): void;
  Area(): Standard_Real;
  Axis(): gp_Ax1;
  Directrix1(): gp_Ax1;
  Directrix2(): gp_Ax1;
  Eccentricity(): Standard_Real;
  Focal(): Standard_Real;
  Focus1(): gp_Pnt;
  Focus2(): gp_Pnt;
  Location(): gp_Pnt;
  MajorRadius(): Standard_Real;
  MinorRadius(): Standard_Real;
  Parameter(): Standard_Real;
  Position(): gp_Ax2;
  XAxis(): gp_Ax1;
  YAxis(): gp_Ax1;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Elips;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Elips;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Elips;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Elips;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Elips;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Elips;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Elips;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Elips;
  delete(): void;
}

  export declare class gp_Elips_1 extends gp_Elips {
    constructor();
  }

  export declare class gp_Elips_2 extends gp_Elips {
    constructor(theA2: gp_Ax2, theMajorRadius: Standard_Real, theMinorRadius: Standard_Real);
  }

export declare class gp_Trsf {
  SetMirror_1(theP: gp_Pnt): void;
  SetMirror_2(theA1: gp_Ax1): void;
  SetMirror_3(theA2: gp_Ax2): void;
  SetRotation_1(theA1: gp_Ax1, theAng: Standard_Real): void;
  SetRotation_2(theR: gp_Quaternion): void;
  SetRotationPart(theR: gp_Quaternion): void;
  SetScale(theP: gp_Pnt, theS: Standard_Real): void;
  SetDisplacement(theFromSystem1: gp_Ax3, theToSystem2: gp_Ax3): void;
  SetTransformation_1(theFromSystem1: gp_Ax3, theToSystem2: gp_Ax3): void;
  SetTransformation_2(theToSystem: gp_Ax3): void;
  SetTransformation_3(R: gp_Quaternion, theT: gp_Vec): void;
  SetTranslation_1(theV: gp_Vec): void;
  SetTranslation_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  SetTranslationPart(theV: gp_Vec): void;
  SetScaleFactor(theS: Standard_Real): void;
  SetForm(theP: gp_TrsfForm): void;
  SetValues(a11: Standard_Real, a12: Standard_Real, a13: Standard_Real, a14: Standard_Real, a21: Standard_Real, a22: Standard_Real, a23: Standard_Real, a24: Standard_Real, a31: Standard_Real, a32: Standard_Real, a33: Standard_Real, a34: Standard_Real): void;
  IsNegative(): Standard_Boolean;
  Form(): gp_TrsfForm;
  ScaleFactor(): Standard_Real;
  TranslationPart(): gp_XYZ;
  GetRotation_1(theAxis: gp_XYZ, theAngle: Standard_Real): Standard_Boolean;
  GetRotation_2(): gp_Quaternion;
  VectorialPart(): gp_Mat;
  HVectorialPart(): gp_Mat;
  Value(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId): Standard_Real;
  Invert(): void;
  Inverted(): gp_Trsf;
  Multiplied(theT: gp_Trsf): gp_Trsf;
  Multiply(theT: gp_Trsf): void;
  PreMultiply(theT: gp_Trsf): void;
  Power(theN: Graphic3d_ZLayerId): void;
  Powered(theN: Graphic3d_ZLayerId): gp_Trsf;
  Transforms_1(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real): void;
  Transforms_2(theCoord: gp_XYZ): void;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Trsf_1 extends gp_Trsf {
    constructor();
  }

  export declare class gp_Trsf_2 extends gp_Trsf {
    constructor(theT: gp_Trsf2d);
  }

export declare class gp_Vec2d {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXv: Standard_Real, theYv: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetXY(theCoord: gp_XY): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXv: Standard_Real, theYv: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  XY(): gp_XY;
  IsEqual(theOther: gp_Vec2d, theLinearTolerance: Standard_Real, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Vec2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Vec2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Vec2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Vec2d): Standard_Real;
  Magnitude(): Standard_Real;
  SquareMagnitude(): Standard_Real;
  Add(theOther: gp_Vec2d): void;
  Added(theOther: gp_Vec2d): gp_Vec2d;
  Crossed(theRight: gp_Vec2d): Standard_Real;
  CrossMagnitude(theRight: gp_Vec2d): Standard_Real;
  CrossSquareMagnitude(theRight: gp_Vec2d): Standard_Real;
  Divide(theScalar: Standard_Real): void;
  Divided(theScalar: Standard_Real): gp_Vec2d;
  Dot(theOther: gp_Vec2d): Standard_Real;
  GetNormal(): gp_Vec2d;
  Multiply(theScalar: Standard_Real): void;
  Multiplied(theScalar: Standard_Real): gp_Vec2d;
  Normalize(): void;
  Normalized(): gp_Vec2d;
  Reverse(): void;
  Reversed(): gp_Vec2d;
  Subtract(theRight: gp_Vec2d): void;
  Subtracted(theRight: gp_Vec2d): gp_Vec2d;
  SetLinearForm_1(theA1: Standard_Real, theV1: gp_Vec2d, theA2: Standard_Real, theV2: gp_Vec2d, theV3: gp_Vec2d): void;
  SetLinearForm_2(theA1: Standard_Real, theV1: gp_Vec2d, theA2: Standard_Real, theV2: gp_Vec2d): void;
  SetLinearForm_3(theA1: Standard_Real, theV1: gp_Vec2d, theV2: gp_Vec2d): void;
  SetLinearForm_4(theV1: gp_Vec2d, theV2: gp_Vec2d): void;
  Mirror_1(theV: gp_Vec2d): void;
  Mirrored_1(theV: gp_Vec2d): gp_Vec2d;
  Mirror_2(theA1: gp_Ax2d): void;
  Mirrored_2(theA1: gp_Ax2d): gp_Vec2d;
  Rotate(theAng: Standard_Real): void;
  Rotated(theAng: Standard_Real): gp_Vec2d;
  Scale(theS: Standard_Real): void;
  Scaled(theS: Standard_Real): gp_Vec2d;
  Transform(theT: gp_Trsf2d): void;
  Transformed(theT: gp_Trsf2d): gp_Vec2d;
  delete(): void;
}

  export declare class gp_Vec2d_1 extends gp_Vec2d {
    constructor();
  }

  export declare class gp_Vec2d_2 extends gp_Vec2d {
    constructor(theV: gp_Dir2d);
  }

  export declare class gp_Vec2d_3 extends gp_Vec2d {
    constructor(theCoord: gp_XY);
  }

  export declare class gp_Vec2d_4 extends gp_Vec2d {
    constructor(theXv: Standard_Real, theYv: Standard_Real);
  }

  export declare class gp_Vec2d_5 extends gp_Vec2d {
    constructor(theP1: gp_Pnt2d, theP2: gp_Pnt2d);
  }

export declare class gp_Circ {
  SetAxis(theA1: gp_Ax1): void;
  SetLocation(theP: gp_Pnt): void;
  SetPosition(theA2: gp_Ax2): void;
  SetRadius(theRadius: Standard_Real): void;
  Area(): Standard_Real;
  Axis(): gp_Ax1;
  Length(): Standard_Real;
  Location(): gp_Pnt;
  Position(): gp_Ax2;
  Radius(): Standard_Real;
  XAxis(): gp_Ax1;
  YAxis(): gp_Ax1;
  Distance(theP: gp_Pnt): Standard_Real;
  SquareDistance(theP: gp_Pnt): Standard_Real;
  Contains(theP: gp_Pnt, theLinearTolerance: Standard_Real): Standard_Boolean;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Circ;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Circ;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Circ;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Circ;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Circ;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Circ;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Circ;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Circ;
  delete(): void;
}

  export declare class gp_Circ_1 extends gp_Circ {
    constructor();
  }

  export declare class gp_Circ_2 extends gp_Circ {
    constructor(theA2: gp_Ax2, theRadius: Standard_Real);
  }

export declare class gp_Dir {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetZ(theZ: Standard_Real): void;
  SetXYZ(theCoord: gp_XYZ): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  Z(): Standard_Real;
  XYZ(): gp_XYZ;
  IsEqual(theOther: gp_Dir, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Dir, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Dir, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Dir, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Dir): Standard_Real;
  AngleWithRef(theOther: gp_Dir, theVRef: gp_Dir): Standard_Real;
  Cross(theRight: gp_Dir): void;
  Crossed(theRight: gp_Dir): gp_Dir;
  CrossCross(theV1: gp_Dir, theV2: gp_Dir): void;
  CrossCrossed(theV1: gp_Dir, theV2: gp_Dir): gp_Dir;
  Dot(theOther: gp_Dir): Standard_Real;
  DotCross(theV1: gp_Dir, theV2: gp_Dir): Standard_Real;
  Reverse(): void;
  Reversed(): gp_Dir;
  Mirror_1(theV: gp_Dir): void;
  Mirrored_1(theV: gp_Dir): gp_Dir;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Dir;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Dir;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Dir;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Dir;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Dir_1 extends gp_Dir {
    constructor();
  }

  export declare class gp_Dir_2 extends gp_Dir {
    constructor(theV: gp_Vec);
  }

  export declare class gp_Dir_3 extends gp_Dir {
    constructor(theCoord: gp_XYZ);
  }

  export declare class gp_Dir_4 extends gp_Dir {
    constructor(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real);
  }

export declare class gp_XYZ {
  SetCoord_1(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real): void;
  SetCoord_2(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetZ(theZ: Standard_Real): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  ChangeCoord(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real): void;
  GetData(): Standard_Real;
  ChangeData(): Standard_Real;
  X(): Standard_Real;
  Y(): Standard_Real;
  Z(): Standard_Real;
  Modulus(): Standard_Real;
  SquareModulus(): Standard_Real;
  IsEqual(theOther: gp_XYZ, theTolerance: Standard_Real): Standard_Boolean;
  Add(theOther: gp_XYZ): void;
  Added(theOther: gp_XYZ): gp_XYZ;
  Cross(theOther: gp_XYZ): void;
  Crossed(theOther: gp_XYZ): gp_XYZ;
  CrossMagnitude(theRight: gp_XYZ): Standard_Real;
  CrossSquareMagnitude(theRight: gp_XYZ): Standard_Real;
  CrossCross(theCoord1: gp_XYZ, theCoord2: gp_XYZ): void;
  CrossCrossed(theCoord1: gp_XYZ, theCoord2: gp_XYZ): gp_XYZ;
  Divide(theScalar: Standard_Real): void;
  Divided(theScalar: Standard_Real): gp_XYZ;
  Dot(theOther: gp_XYZ): Standard_Real;
  DotCross(theCoord1: gp_XYZ, theCoord2: gp_XYZ): Standard_Real;
  Multiply_1(theScalar: Standard_Real): void;
  Multiply_2(theOther: gp_XYZ): void;
  Multiply_3(theMatrix: gp_Mat): void;
  Multiplied_1(theScalar: Standard_Real): gp_XYZ;
  Multiplied_2(theOther: gp_XYZ): gp_XYZ;
  Multiplied_3(theMatrix: gp_Mat): gp_XYZ;
  Normalize(): void;
  Normalized(): gp_XYZ;
  Reverse(): void;
  Reversed(): gp_XYZ;
  Subtract(theOther: gp_XYZ): void;
  Subtracted(theOther: gp_XYZ): gp_XYZ;
  SetLinearForm_1(theA1: Standard_Real, theXYZ1: gp_XYZ, theA2: Standard_Real, theXYZ2: gp_XYZ, theA3: Standard_Real, theXYZ3: gp_XYZ, theXYZ4: gp_XYZ): void;
  SetLinearForm_2(theA1: Standard_Real, theXYZ1: gp_XYZ, theA2: Standard_Real, theXYZ2: gp_XYZ, theA3: Standard_Real, theXYZ3: gp_XYZ): void;
  SetLinearForm_3(theA1: Standard_Real, theXYZ1: gp_XYZ, theA2: Standard_Real, theXYZ2: gp_XYZ, theXYZ3: gp_XYZ): void;
  SetLinearForm_4(theA1: Standard_Real, theXYZ1: gp_XYZ, theA2: Standard_Real, theXYZ2: gp_XYZ): void;
  SetLinearForm_5(theA1: Standard_Real, theXYZ1: gp_XYZ, theXYZ2: gp_XYZ): void;
  SetLinearForm_6(theXYZ1: gp_XYZ, theXYZ2: gp_XYZ): void;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_XYZ_1 extends gp_XYZ {
    constructor();
  }

  export declare class gp_XYZ_2 extends gp_XYZ {
    constructor(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real);
  }

export declare class gp_GTrsf {
  SetAffinity_1(theA1: gp_Ax1, theRatio: Standard_Real): void;
  SetAffinity_2(theA2: gp_Ax2, theRatio: Standard_Real): void;
  SetValue(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId, theValue: Standard_Real): void;
  SetVectorialPart(theMatrix: gp_Mat): void;
  SetTranslationPart(theCoord: gp_XYZ): void;
  SetTrsf(theT: gp_Trsf): void;
  IsNegative(): Standard_Boolean;
  IsSingular(): Standard_Boolean;
  Form(): gp_TrsfForm;
  SetForm(): void;
  TranslationPart(): gp_XYZ;
  VectorialPart(): gp_Mat;
  Value(theRow: Graphic3d_ZLayerId, theCol: Graphic3d_ZLayerId): Standard_Real;
  Invert(): void;
  Inverted(): gp_GTrsf;
  Multiplied(theT: gp_GTrsf): gp_GTrsf;
  Multiply(theT: gp_GTrsf): void;
  PreMultiply(theT: gp_GTrsf): void;
  Power(theN: Graphic3d_ZLayerId): void;
  Powered(theN: Graphic3d_ZLayerId): gp_GTrsf;
  Transforms_1(theCoord: gp_XYZ): void;
  Transforms_2(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real): void;
  Trsf(): gp_Trsf;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_GTrsf_1 extends gp_GTrsf {
    constructor();
  }

  export declare class gp_GTrsf_2 extends gp_GTrsf {
    constructor(theT: gp_Trsf);
  }

  export declare class gp_GTrsf_3 extends gp_GTrsf {
    constructor(theM: gp_Mat, theV: gp_XYZ);
  }

export declare class gp_Ax1 {
  SetDirection(theV: gp_Dir): void;
  SetLocation(theP: gp_Pnt): void;
  Direction(): gp_Dir;
  Location(): gp_Pnt;
  IsCoaxial(Other: gp_Ax1, AngularTolerance: Standard_Real, LinearTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Ax1, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Ax1, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Ax1, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Ax1): Standard_Real;
  Reverse(): void;
  Reversed(): gp_Ax1;
  Mirror_1(P: gp_Pnt): void;
  Mirrored_1(P: gp_Pnt): gp_Ax1;
  Mirror_2(A1: gp_Ax1): void;
  Mirrored_2(A1: gp_Ax1): gp_Ax1;
  Mirror_3(A2: gp_Ax2): void;
  Mirrored_3(A2: gp_Ax2): gp_Ax1;
  Rotate(theA1: gp_Ax1, theAngRad: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAngRad: Standard_Real): gp_Ax1;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Ax1;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Ax1;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Ax1;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Ax1;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Ax1_1 extends gp_Ax1 {
    constructor();
  }

  export declare class gp_Ax1_2 extends gp_Ax1 {
    constructor(theP: gp_Pnt, theV: gp_Dir);
  }

export declare class gp_Pnt {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXp: Standard_Real, theYp: Standard_Real, theZp: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetZ(theZ: Standard_Real): void;
  SetXYZ(theCoord: gp_XYZ): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXp: Standard_Real, theYp: Standard_Real, theZp: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  Z(): Standard_Real;
  XYZ(): gp_XYZ;
  Coord_3(): gp_XYZ;
  ChangeCoord(): gp_XYZ;
  BaryCenter(theAlpha: Standard_Real, theP: gp_Pnt, theBeta: Standard_Real): void;
  IsEqual(theOther: gp_Pnt, theLinearTolerance: Standard_Real): Standard_Boolean;
  Distance(theOther: gp_Pnt): Standard_Real;
  SquareDistance(theOther: gp_Pnt): Standard_Real;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Pnt;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Pnt;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Pnt;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Pnt;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Pnt;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Pnt;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Pnt;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Pnt;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Pnt_1 extends gp_Pnt {
    constructor();
  }

  export declare class gp_Pnt_2 extends gp_Pnt {
    constructor(theCoord: gp_XYZ);
  }

  export declare class gp_Pnt_3 extends gp_Pnt {
    constructor(theXp: Standard_Real, theYp: Standard_Real, theZp: Standard_Real);
  }

export declare class gp_Quaternion {
  IsEqual(theOther: gp_Quaternion): Standard_Boolean;
  SetRotation_1(theVecFrom: gp_Vec, theVecTo: gp_Vec): void;
  SetRotation_2(theVecFrom: gp_Vec, theVecTo: gp_Vec, theHelpCrossVec: gp_Vec): void;
  SetVectorAndAngle(theAxis: gp_Vec, theAngle: Standard_Real): void;
  GetVectorAndAngle(theAxis: gp_Vec, theAngle: Standard_Real): void;
  SetMatrix(theMat: gp_Mat): void;
  GetMatrix(): gp_Mat;
  SetEulerAngles(theOrder: gp_EulerSequence, theAlpha: Standard_Real, theBeta: Standard_Real, theGamma: Standard_Real): void;
  GetEulerAngles(theOrder: gp_EulerSequence, theAlpha: Standard_Real, theBeta: Standard_Real, theGamma: Standard_Real): void;
  Set_1(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real, theW: Standard_Real): void;
  Set_2(theQuaternion: gp_Quaternion): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  Z(): Standard_Real;
  W(): Standard_Real;
  SetIdent(): void;
  Reverse(): void;
  Reversed(): gp_Quaternion;
  Invert(): void;
  Inverted(): gp_Quaternion;
  SquareNorm(): Standard_Real;
  Norm(): Standard_Real;
  Scale(theScale: Standard_Real): void;
  Scaled(theScale: Standard_Real): gp_Quaternion;
  StabilizeLength(): void;
  Normalize(): void;
  Normalized(): gp_Quaternion;
  Negated(): gp_Quaternion;
  Added(theOther: gp_Quaternion): gp_Quaternion;
  Subtracted(theOther: gp_Quaternion): gp_Quaternion;
  Multiplied(theOther: gp_Quaternion): gp_Quaternion;
  Add(theOther: gp_Quaternion): void;
  Subtract(theOther: gp_Quaternion): void;
  Multiply_1(theOther: gp_Quaternion): void;
  Dot(theOther: gp_Quaternion): Standard_Real;
  GetRotationAngle(): Standard_Real;
  Multiply_2(theVec: gp_Vec): gp_Vec;
  delete(): void;
}

  export declare class gp_Quaternion_1 extends gp_Quaternion {
    constructor();
  }

  export declare class gp_Quaternion_2 extends gp_Quaternion {
    constructor(theX: Standard_Real, theY: Standard_Real, theZ: Standard_Real, theW: Standard_Real);
  }

  export declare class gp_Quaternion_3 extends gp_Quaternion {
    constructor(theVecFrom: gp_Vec, theVecTo: gp_Vec);
  }

  export declare class gp_Quaternion_4 extends gp_Quaternion {
    constructor(theVecFrom: gp_Vec, theVecTo: gp_Vec, theHelpCrossVec: gp_Vec);
  }

  export declare class gp_Quaternion_5 extends gp_Quaternion {
    constructor(theAxis: gp_Vec, theAngle: Standard_Real);
  }

  export declare class gp_Quaternion_6 extends gp_Quaternion {
    constructor(theMat: gp_Mat);
  }

export declare class gp_Ax2d {
  SetLocation(theP: gp_Pnt2d): void;
  SetDirection(theV: gp_Dir2d): void;
  Location(): gp_Pnt2d;
  Direction(): gp_Dir2d;
  IsCoaxial(Other: gp_Ax2d, AngularTolerance: Standard_Real, LinearTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Ax2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Ax2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Ax2d, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Ax2d): Standard_Real;
  Reverse(): void;
  Reversed(): gp_Ax2d;
  Mirror_1(P: gp_Pnt2d): void;
  Mirrored_1(P: gp_Pnt2d): gp_Ax2d;
  Mirror_2(A: gp_Ax2d): void;
  Mirrored_2(A: gp_Ax2d): gp_Ax2d;
  Rotate(theP: gp_Pnt2d, theAng: Standard_Real): void;
  Rotated(theP: gp_Pnt2d, theAng: Standard_Real): gp_Ax2d;
  Scale(P: gp_Pnt2d, S: Standard_Real): void;
  Scaled(theP: gp_Pnt2d, theS: Standard_Real): gp_Ax2d;
  Transform(theT: gp_Trsf2d): void;
  Transformed(theT: gp_Trsf2d): gp_Ax2d;
  Translate_1(theV: gp_Vec2d): void;
  Translated_1(theV: gp_Vec2d): gp_Ax2d;
  Translate_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): void;
  Translated_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): gp_Ax2d;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_Ax2d_1 extends gp_Ax2d {
    constructor();
  }

  export declare class gp_Ax2d_2 extends gp_Ax2d {
    constructor(theP: gp_Pnt2d, theV: gp_Dir2d);
  }

export declare class gp_Elips2d {
  SetLocation(theP: gp_Pnt2d): void;
  SetMajorRadius(theMajorRadius: Standard_Real): void;
  SetMinorRadius(theMinorRadius: Standard_Real): void;
  SetAxis(theA: gp_Ax22d): void;
  SetXAxis(theA: gp_Ax2d): void;
  SetYAxis(theA: gp_Ax2d): void;
  Area(): Standard_Real;
  Coefficients(theA: Standard_Real, theB: Standard_Real, theC: Standard_Real, theD: Standard_Real, theE: Standard_Real, theF: Standard_Real): void;
  Directrix1(): gp_Ax2d;
  Directrix2(): gp_Ax2d;
  Eccentricity(): Standard_Real;
  Focal(): Standard_Real;
  Focus1(): gp_Pnt2d;
  Focus2(): gp_Pnt2d;
  Location(): gp_Pnt2d;
  MajorRadius(): Standard_Real;
  MinorRadius(): Standard_Real;
  Parameter(): Standard_Real;
  Axis(): gp_Ax22d;
  XAxis(): gp_Ax2d;
  YAxis(): gp_Ax2d;
  Reverse(): void;
  Reversed(): gp_Elips2d;
  IsDirect(): Standard_Boolean;
  Mirror_1(theP: gp_Pnt2d): void;
  Mirrored_1(theP: gp_Pnt2d): gp_Elips2d;
  Mirror_2(theA: gp_Ax2d): void;
  Mirrored_2(theA: gp_Ax2d): gp_Elips2d;
  Rotate(theP: gp_Pnt2d, theAng: Standard_Real): void;
  Rotated(theP: gp_Pnt2d, theAng: Standard_Real): gp_Elips2d;
  Scale(theP: gp_Pnt2d, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt2d, theS: Standard_Real): gp_Elips2d;
  Transform(theT: gp_Trsf2d): void;
  Transformed(theT: gp_Trsf2d): gp_Elips2d;
  Translate_1(theV: gp_Vec2d): void;
  Translated_1(theV: gp_Vec2d): gp_Elips2d;
  Translate_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): void;
  Translated_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): gp_Elips2d;
  delete(): void;
}

  export declare class gp_Elips2d_1 extends gp_Elips2d {
    constructor();
  }

  export declare class gp_Elips2d_2 extends gp_Elips2d {
    constructor(theMajorAxis: gp_Ax2d, theMajorRadius: Standard_Real, theMinorRadius: Standard_Real, theIsSense: Standard_Boolean);
  }

  export declare class gp_Elips2d_3 extends gp_Elips2d {
    constructor(theA: gp_Ax22d, theMajorRadius: Standard_Real, theMinorRadius: Standard_Real);
  }

export declare class gp_Pnt2d {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXp: Standard_Real, theYp: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetXY(theCoord: gp_XY): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXp: Standard_Real, theYp: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  XY(): gp_XY;
  Coord_3(): gp_XY;
  ChangeCoord(): gp_XY;
  IsEqual(theOther: gp_Pnt2d, theLinearTolerance: Standard_Real): Standard_Boolean;
  Distance(theOther: gp_Pnt2d): Standard_Real;
  SquareDistance(theOther: gp_Pnt2d): Standard_Real;
  Mirror_1(theP: gp_Pnt2d): void;
  Mirrored_1(theP: gp_Pnt2d): gp_Pnt2d;
  Mirror_2(theA: gp_Ax2d): void;
  Mirrored_2(theA: gp_Ax2d): gp_Pnt2d;
  Rotate(theP: gp_Pnt2d, theAng: Standard_Real): void;
  Rotated(theP: gp_Pnt2d, theAng: Standard_Real): gp_Pnt2d;
  Scale(theP: gp_Pnt2d, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt2d, theS: Standard_Real): gp_Pnt2d;
  Transform(theT: gp_Trsf2d): void;
  Transformed(theT: gp_Trsf2d): gp_Pnt2d;
  Translate_1(theV: gp_Vec2d): void;
  Translated_1(theV: gp_Vec2d): gp_Pnt2d;
  Translate_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): void;
  Translated_2(theP1: gp_Pnt2d, theP2: gp_Pnt2d): gp_Pnt2d;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_Pnt2d_1 extends gp_Pnt2d {
    constructor();
  }

  export declare class gp_Pnt2d_2 extends gp_Pnt2d {
    constructor(theCoord: gp_XY);
  }

  export declare class gp_Pnt2d_3 extends gp_Pnt2d {
    constructor(theXp: Standard_Real, theYp: Standard_Real);
  }

export declare class gp_Vec {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  SetZ(theZ: Standard_Real): void;
  SetXYZ(theCoord: gp_XYZ): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  Z(): Standard_Real;
  XYZ(): gp_XYZ;
  IsEqual(theOther: gp_Vec, theLinearTolerance: Standard_Real, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsNormal(theOther: gp_Vec, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsOpposite(theOther: gp_Vec, theAngularTolerance: Standard_Real): Standard_Boolean;
  IsParallel(theOther: gp_Vec, theAngularTolerance: Standard_Real): Standard_Boolean;
  Angle(theOther: gp_Vec): Standard_Real;
  AngleWithRef(theOther: gp_Vec, theVRef: gp_Vec): Standard_Real;
  Magnitude(): Standard_Real;
  SquareMagnitude(): Standard_Real;
  Add(theOther: gp_Vec): void;
  Added(theOther: gp_Vec): gp_Vec;
  Subtract(theRight: gp_Vec): void;
  Subtracted(theRight: gp_Vec): gp_Vec;
  Multiply(theScalar: Standard_Real): void;
  Multiplied(theScalar: Standard_Real): gp_Vec;
  Divide(theScalar: Standard_Real): void;
  Divided(theScalar: Standard_Real): gp_Vec;
  Cross(theRight: gp_Vec): void;
  Crossed(theRight: gp_Vec): gp_Vec;
  CrossMagnitude(theRight: gp_Vec): Standard_Real;
  CrossSquareMagnitude(theRight: gp_Vec): Standard_Real;
  CrossCross(theV1: gp_Vec, theV2: gp_Vec): void;
  CrossCrossed(theV1: gp_Vec, theV2: gp_Vec): gp_Vec;
  Dot(theOther: gp_Vec): Standard_Real;
  DotCross(theV1: gp_Vec, theV2: gp_Vec): Standard_Real;
  Normalize(): void;
  Normalized(): gp_Vec;
  Reverse(): void;
  Reversed(): gp_Vec;
  SetLinearForm_1(theA1: Standard_Real, theV1: gp_Vec, theA2: Standard_Real, theV2: gp_Vec, theA3: Standard_Real, theV3: gp_Vec, theV4: gp_Vec): void;
  SetLinearForm_2(theA1: Standard_Real, theV1: gp_Vec, theA2: Standard_Real, theV2: gp_Vec, theA3: Standard_Real, theV3: gp_Vec): void;
  SetLinearForm_3(theA1: Standard_Real, theV1: gp_Vec, theA2: Standard_Real, theV2: gp_Vec, theV3: gp_Vec): void;
  SetLinearForm_4(theA1: Standard_Real, theV1: gp_Vec, theA2: Standard_Real, theV2: gp_Vec): void;
  SetLinearForm_5(theA1: Standard_Real, theV1: gp_Vec, theV2: gp_Vec): void;
  SetLinearForm_6(theV1: gp_Vec, theV2: gp_Vec): void;
  Mirror_1(theV: gp_Vec): void;
  Mirrored_1(theV: gp_Vec): gp_Vec;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Vec;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Vec;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Vec;
  Scale(theS: Standard_Real): void;
  Scaled(theS: Standard_Real): gp_Vec;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Vec;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class gp_Vec_1 extends gp_Vec {
    constructor();
  }

  export declare class gp_Vec_2 extends gp_Vec {
    constructor(theV: gp_Dir);
  }

  export declare class gp_Vec_3 extends gp_Vec {
    constructor(theCoord: gp_XYZ);
  }

  export declare class gp_Vec_4 extends gp_Vec {
    constructor(theXv: Standard_Real, theYv: Standard_Real, theZv: Standard_Real);
  }

  export declare class gp_Vec_5 extends gp_Vec {
    constructor(theP1: gp_Pnt, theP2: gp_Pnt);
  }

export declare class gp_XY {
  SetCoord_1(theIndex: Graphic3d_ZLayerId, theXi: Standard_Real): void;
  SetCoord_2(theX: Standard_Real, theY: Standard_Real): void;
  SetX(theX: Standard_Real): void;
  SetY(theY: Standard_Real): void;
  Coord_1(theIndex: Graphic3d_ZLayerId): Standard_Real;
  ChangeCoord(theIndex: Graphic3d_ZLayerId): Standard_Real;
  Coord_2(theX: Standard_Real, theY: Standard_Real): void;
  X(): Standard_Real;
  Y(): Standard_Real;
  Modulus(): Standard_Real;
  SquareModulus(): Standard_Real;
  IsEqual(theOther: gp_XY, theTolerance: Standard_Real): Standard_Boolean;
  Add(theOther: gp_XY): void;
  Added(theOther: gp_XY): gp_XY;
  Crossed(theOther: gp_XY): Standard_Real;
  CrossMagnitude(theRight: gp_XY): Standard_Real;
  CrossSquareMagnitude(theRight: gp_XY): Standard_Real;
  Divide(theScalar: Standard_Real): void;
  Divided(theScalar: Standard_Real): gp_XY;
  Dot(theOther: gp_XY): Standard_Real;
  Multiply_1(theScalar: Standard_Real): void;
  Multiply_2(theOther: gp_XY): void;
  Multiply_3(theMatrix: gp_Mat2d): void;
  Multiplied_1(theScalar: Standard_Real): gp_XY;
  Multiplied_2(theOther: gp_XY): gp_XY;
  Multiplied_3(theMatrix: gp_Mat2d): gp_XY;
  Normalize(): void;
  Normalized(): gp_XY;
  Reverse(): void;
  Reversed(): gp_XY;
  SetLinearForm_1(theA1: Standard_Real, theXY1: gp_XY, theA2: Standard_Real, theXY2: gp_XY): void;
  SetLinearForm_2(theA1: Standard_Real, theXY1: gp_XY, theA2: Standard_Real, theXY2: gp_XY, theXY3: gp_XY): void;
  SetLinearForm_3(theA1: Standard_Real, theXY1: gp_XY, theXY2: gp_XY): void;
  SetLinearForm_4(theXY1: gp_XY, theXY2: gp_XY): void;
  Subtract(theOther: gp_XY): void;
  Subtracted(theOther: gp_XY): gp_XY;
  delete(): void;
}

  export declare class gp_XY_1 extends gp_XY {
    constructor();
  }

  export declare class gp_XY_2 extends gp_XY {
    constructor(theX: Standard_Real, theY: Standard_Real);
  }

export declare class gp_Ax2 {
  SetAxis(A1: gp_Ax1): void;
  SetDirection(V: gp_Dir): void;
  SetLocation(theP: gp_Pnt): void;
  SetXDirection(theVx: gp_Dir): void;
  SetYDirection(theVy: gp_Dir): void;
  Angle(theOther: gp_Ax2): Standard_Real;
  Axis(): gp_Ax1;
  Direction(): gp_Dir;
  Location(): gp_Pnt;
  XDirection(): gp_Dir;
  YDirection(): gp_Dir;
  IsCoplanar_1(Other: gp_Ax2, LinearTolerance: Standard_Real, AngularTolerance: Standard_Real): Standard_Boolean;
  IsCoplanar_2(A1: gp_Ax1, LinearTolerance: Standard_Real, AngularTolerance: Standard_Real): Standard_Boolean;
  Mirror_1(P: gp_Pnt): void;
  Mirrored_1(P: gp_Pnt): gp_Ax2;
  Mirror_2(A1: gp_Ax1): void;
  Mirrored_2(A1: gp_Ax1): gp_Ax2;
  Mirror_3(A2: gp_Ax2): void;
  Mirrored_3(A2: gp_Ax2): gp_Ax2;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Ax2;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Ax2;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Ax2;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Ax2;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Ax2;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class gp_Ax2_1 extends gp_Ax2 {
    constructor();
  }

  export declare class gp_Ax2_2 extends gp_Ax2 {
    constructor(P: gp_Pnt, N: gp_Dir, Vx: gp_Dir);
  }

  export declare class gp_Ax2_3 extends gp_Ax2 {
    constructor(P: gp_Pnt, V: gp_Dir);
  }

export declare class gp_Cylinder {
  SetAxis(theA1: gp_Ax1): void;
  SetLocation(theLoc: gp_Pnt): void;
  SetPosition(theA3: gp_Ax3): void;
  SetRadius(theR: Standard_Real): void;
  UReverse(): void;
  VReverse(): void;
  Direct(): Standard_Boolean;
  Axis(): gp_Ax1;
  Coefficients(theA1: Standard_Real, theA2: Standard_Real, theA3: Standard_Real, theB1: Standard_Real, theB2: Standard_Real, theB3: Standard_Real, theC1: Standard_Real, theC2: Standard_Real, theC3: Standard_Real, theD: Standard_Real): void;
  Location(): gp_Pnt;
  Position(): gp_Ax3;
  Radius(): Standard_Real;
  XAxis(): gp_Ax1;
  YAxis(): gp_Ax1;
  Mirror_1(theP: gp_Pnt): void;
  Mirrored_1(theP: gp_Pnt): gp_Cylinder;
  Mirror_2(theA1: gp_Ax1): void;
  Mirrored_2(theA1: gp_Ax1): gp_Cylinder;
  Mirror_3(theA2: gp_Ax2): void;
  Mirrored_3(theA2: gp_Ax2): gp_Cylinder;
  Rotate(theA1: gp_Ax1, theAng: Standard_Real): void;
  Rotated(theA1: gp_Ax1, theAng: Standard_Real): gp_Cylinder;
  Scale(theP: gp_Pnt, theS: Standard_Real): void;
  Scaled(theP: gp_Pnt, theS: Standard_Real): gp_Cylinder;
  Transform(theT: gp_Trsf): void;
  Transformed(theT: gp_Trsf): gp_Cylinder;
  Translate_1(theV: gp_Vec): void;
  Translated_1(theV: gp_Vec): gp_Cylinder;
  Translate_2(theP1: gp_Pnt, theP2: gp_Pnt): void;
  Translated_2(theP1: gp_Pnt, theP2: gp_Pnt): gp_Cylinder;
  delete(): void;
}

  export declare class gp_Cylinder_1 extends gp_Cylinder {
    constructor();
  }

  export declare class gp_Cylinder_2 extends gp_Cylinder {
    constructor(theA3: gp_Ax3, theRadius: Standard_Real);
  }

export declare class ShapeAnalysis_Surface extends Standard_Transient {
  constructor(S: Handle_Geom_Surface)
  Init_1(S: Handle_Geom_Surface): void;
  Init_2(other: Handle_ShapeAnalysis_Surface): void;
  SetDomain(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  Surface(): Handle_Geom_Surface;
  Adaptor3d(): Handle_GeomAdaptor_Surface;
  TrueAdaptor3d(): Handle_GeomAdaptor_Surface;
  Gap(): Standard_Real;
  Value_1(u: Standard_Real, v: Standard_Real): gp_Pnt;
  Value_2(p2d: gp_Pnt2d): gp_Pnt;
  HasSingularities(preci: Standard_Real): Standard_Boolean;
  NbSingularities(preci: Standard_Real): Graphic3d_ZLayerId;
  Singularity(num: Graphic3d_ZLayerId, preci: Standard_Real, P3d: gp_Pnt, firstP2d: gp_Pnt2d, lastP2d: gp_Pnt2d, firstpar: Standard_Real, lastpar: Standard_Real, uisodeg: Standard_Boolean): Standard_Boolean;
  IsDegenerated_1(P3d: gp_Pnt, preci: Standard_Real): Standard_Boolean;
  DegeneratedValues(P3d: gp_Pnt, preci: Standard_Real, firstP2d: gp_Pnt2d, lastP2d: gp_Pnt2d, firstpar: Standard_Real, lastpar: Standard_Real, forward: Standard_Boolean): Standard_Boolean;
  ProjectDegenerated_1(P3d: gp_Pnt, preci: Standard_Real, neighbour: gp_Pnt2d, result: gp_Pnt2d): Standard_Boolean;
  ProjectDegenerated_2(nbrPnt: Graphic3d_ZLayerId, points: TColgp_SequenceOfPnt, pnt2d: TColgp_SequenceOfPnt2d, preci: Standard_Real, direct: Standard_Boolean): Standard_Boolean;
  IsDegenerated_2(p2d1: gp_Pnt2d, p2d2: gp_Pnt2d, tol: Standard_Real, ratio: Standard_Real): Standard_Boolean;
  Bounds(ufirst: Standard_Real, ulast: Standard_Real, vfirst: Standard_Real, vlast: Standard_Real): void;
  ComputeBoundIsos(): void;
  UIso(U: Standard_Real): Handle_Geom_Curve;
  VIso(V: Standard_Real): Handle_Geom_Curve;
  IsUClosed(preci: Standard_Real): Standard_Boolean;
  IsVClosed(preci: Standard_Real): Standard_Boolean;
  ValueOfUV(P3D: gp_Pnt, preci: Standard_Real): gp_Pnt2d;
  NextValueOfUV(p2dPrev: gp_Pnt2d, P3D: gp_Pnt, preci: Standard_Real, maxpreci: Standard_Real): gp_Pnt2d;
  UVFromIso(P3D: gp_Pnt, preci: Standard_Real, U: Standard_Real, V: Standard_Real): Standard_Real;
  UCloseVal(): Standard_Real;
  VCloseVal(): Standard_Real;
  GetBoxUF(): Bnd_Box;
  GetBoxUL(): Bnd_Box;
  GetBoxVF(): Bnd_Box;
  GetBoxVL(): Bnd_Box;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class ShapeAnalysis_FreeBounds {
  GetClosedWires(): TopoDS_Compound;
  GetOpenWires(): TopoDS_Compound;
  static ConnectEdgesToWires(edges: Handle_TopTools_HSequenceOfShape, toler: Standard_Real, shared: Standard_Boolean, wires: Handle_TopTools_HSequenceOfShape): void;
  static ConnectWiresToWires_1(iwires: Handle_TopTools_HSequenceOfShape, toler: Standard_Real, shared: Standard_Boolean, owires: Handle_TopTools_HSequenceOfShape): void;
  static ConnectWiresToWires_2(iwires: Handle_TopTools_HSequenceOfShape, toler: Standard_Real, shared: Standard_Boolean, owires: Handle_TopTools_HSequenceOfShape, vertices: TopTools_DataMapOfShapeShape): void;
  static SplitWires_1(wires: Handle_TopTools_HSequenceOfShape, toler: Standard_Real, shared: Standard_Boolean, closed: Handle_TopTools_HSequenceOfShape, open: Handle_TopTools_HSequenceOfShape): void;
  static DispatchWires(wires: Handle_TopTools_HSequenceOfShape, closed: TopoDS_Compound, open: TopoDS_Compound): void;
  delete(): void;
}

  export declare class ShapeAnalysis_FreeBounds_1 extends ShapeAnalysis_FreeBounds {
    constructor();
  }

  export declare class ShapeAnalysis_FreeBounds_2 extends ShapeAnalysis_FreeBounds {
    constructor(shape: TopoDS_Shape, toler: Standard_Real, splitclosed: Standard_Boolean, splitopen: Standard_Boolean);
  }

  export declare class ShapeAnalysis_FreeBounds_3 extends ShapeAnalysis_FreeBounds {
    constructor(shape: TopoDS_Shape, splitclosed: Standard_Boolean, splitopen: Standard_Boolean, checkinternaledges: Standard_Boolean);
  }

export declare class ShapeAnalysis_Edge {
  constructor()
  HasCurve3d(edge: TopoDS_Edge): Standard_Boolean;
  Curve3d(edge: TopoDS_Edge, C3d: Handle_Geom_Curve, cf: Standard_Real, cl: Standard_Real, orient: Standard_Boolean): Standard_Boolean;
  IsClosed3d(edge: TopoDS_Edge): Standard_Boolean;
  HasPCurve_1(edge: TopoDS_Edge, face: TopoDS_Face): Standard_Boolean;
  HasPCurve_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location): Standard_Boolean;
  PCurve_1(edge: TopoDS_Edge, face: TopoDS_Face, C2d: Handle_Geom2d_Curve, cf: Standard_Real, cl: Standard_Real, orient: Standard_Boolean): Standard_Boolean;
  PCurve_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location, C2d: Handle_Geom2d_Curve, cf: Standard_Real, cl: Standard_Real, orient: Standard_Boolean): Standard_Boolean;
  BoundUV_1(edge: TopoDS_Edge, face: TopoDS_Face, first: gp_Pnt2d, last: gp_Pnt2d): Standard_Boolean;
  BoundUV_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location, first: gp_Pnt2d, last: gp_Pnt2d): Standard_Boolean;
  IsSeam_1(edge: TopoDS_Edge, face: TopoDS_Face): Standard_Boolean;
  IsSeam_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location): Standard_Boolean;
  FirstVertex(edge: TopoDS_Edge): TopoDS_Vertex;
  LastVertex(edge: TopoDS_Edge): TopoDS_Vertex;
  GetEndTangent2d_1(edge: TopoDS_Edge, face: TopoDS_Face, atEnd: Standard_Boolean, pos: gp_Pnt2d, tang: gp_Vec2d, dparam: Standard_Real): Standard_Boolean;
  GetEndTangent2d_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location, atEnd: Standard_Boolean, pos: gp_Pnt2d, tang: gp_Vec2d, dparam: Standard_Real): Standard_Boolean;
  CheckVerticesWithCurve3d(edge: TopoDS_Edge, preci: Standard_Real, vtx: Graphic3d_ZLayerId): Standard_Boolean;
  CheckVerticesWithPCurve_1(edge: TopoDS_Edge, face: TopoDS_Face, preci: Standard_Real, vtx: Graphic3d_ZLayerId): Standard_Boolean;
  CheckVerticesWithPCurve_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location, preci: Standard_Real, vtx: Graphic3d_ZLayerId): Standard_Boolean;
  CheckVertexTolerance_1(edge: TopoDS_Edge, face: TopoDS_Face, toler1: Standard_Real, toler2: Standard_Real): Standard_Boolean;
  CheckVertexTolerance_2(edge: TopoDS_Edge, toler1: Standard_Real, toler2: Standard_Real): Standard_Boolean;
  CheckCurve3dWithPCurve_1(edge: TopoDS_Edge, face: TopoDS_Face): Standard_Boolean;
  CheckCurve3dWithPCurve_2(edge: TopoDS_Edge, surface: Handle_Geom_Surface, location: TopLoc_Location): Standard_Boolean;
  Status(status: ShapeExtend_Status): Standard_Boolean;
  CheckSameParameter_1(edge: TopoDS_Edge, maxdev: Standard_Real, NbControl: Graphic3d_ZLayerId): Standard_Boolean;
  CheckSameParameter_2(theEdge: TopoDS_Edge, theFace: TopoDS_Face, theMaxdev: Standard_Real, theNbControl: Graphic3d_ZLayerId): Standard_Boolean;
  CheckPCurveRange(theFirst: Standard_Real, theLast: Standard_Real, thePC: Handle_Geom2d_Curve): Standard_Boolean;
  CheckOverlapping(theEdge1: TopoDS_Edge, theEdge2: TopoDS_Edge, theTolOverlap: Standard_Real, theDomainDist: Standard_Real): Standard_Boolean;
  delete(): void;
}

export declare class ShapeAnalysis_Wire extends Standard_Transient {
  Init_1(wire: TopoDS_Wire, face: TopoDS_Face, precision: Standard_Real): void;
  Init_2(sbwd: Handle_ShapeExtend_WireData, face: TopoDS_Face, precision: Standard_Real): void;
  Load_1(wire: TopoDS_Wire): void;
  Load_2(sbwd: Handle_ShapeExtend_WireData): void;
  SetFace(face: TopoDS_Face): void;
  SetSurface_1(surface: Handle_Geom_Surface): void;
  SetSurface_2(surface: Handle_Geom_Surface, location: TopLoc_Location): void;
  SetPrecision(precision: Standard_Real): void;
  ClearStatuses(): void;
  IsLoaded(): Standard_Boolean;
  IsReady(): Standard_Boolean;
  Precision(): Standard_Real;
  WireData(): Handle_ShapeExtend_WireData;
  NbEdges(): Graphic3d_ZLayerId;
  Face(): TopoDS_Face;
  Surface(): Handle_ShapeAnalysis_Surface;
  Perform(): Standard_Boolean;
  CheckOrder_1(isClosed: Standard_Boolean, mode3d: Standard_Boolean): Standard_Boolean;
  CheckConnected_1(prec: Standard_Real): Standard_Boolean;
  CheckSmall_1(precsmall: Standard_Real): Standard_Boolean;
  CheckEdgeCurves(): Standard_Boolean;
  CheckDegenerated_1(): Standard_Boolean;
  CheckClosed(prec: Standard_Real): Standard_Boolean;
  CheckSelfIntersection(): Standard_Boolean;
  CheckLacking_1(): Standard_Boolean;
  CheckGaps3d(): Standard_Boolean;
  CheckGaps2d(): Standard_Boolean;
  CheckCurveGaps(): Standard_Boolean;
  CheckOrder_2(sawo: ShapeAnalysis_WireOrder, isClosed: Standard_Boolean, mode3d: Standard_Boolean): Standard_Boolean;
  CheckConnected_2(num: Graphic3d_ZLayerId, prec: Standard_Real): Standard_Boolean;
  CheckSmall_2(num: Graphic3d_ZLayerId, precsmall: Standard_Real): Standard_Boolean;
  CheckSeam_1(num: Graphic3d_ZLayerId, C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, cf: Standard_Real, cl: Standard_Real): Standard_Boolean;
  CheckSeam_2(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckDegenerated_2(num: Graphic3d_ZLayerId, dgnr1: gp_Pnt2d, dgnr2: gp_Pnt2d): Standard_Boolean;
  CheckDegenerated_3(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckGap3d(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckGap2d(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckCurveGap(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckSelfIntersectingEdge_1(num: Graphic3d_ZLayerId, points2d: IntRes2d_SequenceOfIntersectionPoint, points3d: TColgp_SequenceOfPnt): Standard_Boolean;
  CheckSelfIntersectingEdge_2(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckIntersectingEdges_1(num: Graphic3d_ZLayerId, points2d: IntRes2d_SequenceOfIntersectionPoint, points3d: TColgp_SequenceOfPnt, errors: TColStd_SequenceOfReal): Standard_Boolean;
  CheckIntersectingEdges_2(num: Graphic3d_ZLayerId): Standard_Boolean;
  CheckIntersectingEdges_3(num1: Graphic3d_ZLayerId, num2: Graphic3d_ZLayerId, points2d: IntRes2d_SequenceOfIntersectionPoint, points3d: TColgp_SequenceOfPnt, errors: TColStd_SequenceOfReal): Standard_Boolean;
  CheckIntersectingEdges_4(num1: Graphic3d_ZLayerId, num2: Graphic3d_ZLayerId): Standard_Boolean;
  CheckLacking_2(num: Graphic3d_ZLayerId, Tolerance: Standard_Real, p2d1: gp_Pnt2d, p2d2: gp_Pnt2d): Standard_Boolean;
  CheckLacking_3(num: Graphic3d_ZLayerId, Tolerance: Standard_Real): Standard_Boolean;
  CheckOuterBound(APIMake: Standard_Boolean): Standard_Boolean;
  CheckNotchedEdges(num: Graphic3d_ZLayerId, shortNum: Graphic3d_ZLayerId, param: Standard_Real, Tolerance: Standard_Real): Standard_Boolean;
  CheckSmallArea(theWire: TopoDS_Wire): Standard_Boolean;
  CheckShapeConnect_1(shape: TopoDS_Shape, prec: Standard_Real): Standard_Boolean;
  CheckShapeConnect_2(tailhead: Standard_Real, tailtail: Standard_Real, headtail: Standard_Real, headhead: Standard_Real, shape: TopoDS_Shape, prec: Standard_Real): Standard_Boolean;
  CheckLoop(aMapLoopVertices: TopTools_IndexedMapOfShape, aMapVertexEdges: TopTools_DataMapOfShapeListOfShape, aMapSmallEdges: TopTools_MapOfShape, aMapSeemEdges: TopTools_MapOfShape): Standard_Boolean;
  CheckTail(theEdge1: TopoDS_Edge, theEdge2: TopoDS_Edge, theMaxSine: Standard_Real, theMaxWidth: Standard_Real, theMaxTolerance: Standard_Real, theEdge11: TopoDS_Edge, theEdge12: TopoDS_Edge, theEdge21: TopoDS_Edge, theEdge22: TopoDS_Edge): Standard_Boolean;
  StatusOrder(Status: ShapeExtend_Status): Standard_Boolean;
  StatusConnected(Status: ShapeExtend_Status): Standard_Boolean;
  StatusEdgeCurves(Status: ShapeExtend_Status): Standard_Boolean;
  StatusDegenerated(Status: ShapeExtend_Status): Standard_Boolean;
  StatusClosed(Status: ShapeExtend_Status): Standard_Boolean;
  StatusSmall(Status: ShapeExtend_Status): Standard_Boolean;
  StatusSelfIntersection(Status: ShapeExtend_Status): Standard_Boolean;
  StatusLacking(Status: ShapeExtend_Status): Standard_Boolean;
  StatusGaps3d(Status: ShapeExtend_Status): Standard_Boolean;
  StatusGaps2d(Status: ShapeExtend_Status): Standard_Boolean;
  StatusCurveGaps(Status: ShapeExtend_Status): Standard_Boolean;
  StatusLoop(Status: ShapeExtend_Status): Standard_Boolean;
  LastCheckStatus(Status: ShapeExtend_Status): Standard_Boolean;
  MinDistance3d(): Standard_Real;
  MinDistance2d(): Standard_Real;
  MaxDistance3d(): Standard_Real;
  MaxDistance2d(): Standard_Real;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeAnalysis_Wire_1 extends ShapeAnalysis_Wire {
    constructor();
  }

  export declare class ShapeAnalysis_Wire_2 extends ShapeAnalysis_Wire {
    constructor(wire: TopoDS_Wire, face: TopoDS_Face, precision: Standard_Real);
  }

  export declare class ShapeAnalysis_Wire_3 extends ShapeAnalysis_Wire {
    constructor(sbwd: Handle_ShapeExtend_WireData, face: TopoDS_Face, precision: Standard_Real);
  }

export declare class Bnd_Box2d {
  constructor()
  SetWhole(): void;
  SetVoid(): void;
  Set_1(thePnt: gp_Pnt2d): void;
  Set_2(thePnt: gp_Pnt2d, theDir: gp_Dir2d): void;
  Update_1(aXmin: Standard_Real, aYmin: Standard_Real, aXmax: Standard_Real, aYmax: Standard_Real): void;
  Update_2(X: Standard_Real, Y: Standard_Real): void;
  GetGap(): Standard_Real;
  SetGap(Tol: Standard_Real): void;
  Enlarge(theTol: Standard_Real): void;
  Get(aXmin: Standard_Real, aYmin: Standard_Real, aXmax: Standard_Real, aYmax: Standard_Real): void;
  OpenXmin(): void;
  OpenXmax(): void;
  OpenYmin(): void;
  OpenYmax(): void;
  IsOpenXmin(): Standard_Boolean;
  IsOpenXmax(): Standard_Boolean;
  IsOpenYmin(): Standard_Boolean;
  IsOpenYmax(): Standard_Boolean;
  IsWhole(): Standard_Boolean;
  IsVoid(): Standard_Boolean;
  Transformed(T: gp_Trsf2d): Bnd_Box2d;
  Add_1(Other: Bnd_Box2d): void;
  Add_2(thePnt: gp_Pnt2d): void;
  Add_3(thePnt: gp_Pnt2d, theDir: gp_Dir2d): void;
  Add_4(D: gp_Dir2d): void;
  IsOut_1(P: gp_Pnt2d): Standard_Boolean;
  IsOut_2(theL: gp_Lin2d): Standard_Boolean;
  IsOut_3(theP0: gp_Pnt2d, theP1: gp_Pnt2d): Standard_Boolean;
  IsOut_4(Other: Bnd_Box2d): Standard_Boolean;
  IsOut_5(theOther: Bnd_Box2d, theTrsf: gp_Trsf2d): Standard_Boolean;
  IsOut_6(T1: gp_Trsf2d, Other: Bnd_Box2d, T2: gp_Trsf2d): Standard_Boolean;
  Dump(): void;
  SquareExtent(): Standard_Real;
  delete(): void;
}

export declare class Bnd_Box {
  SetWhole(): void;
  SetVoid(): void;
  Set_1(P: gp_Pnt): void;
  Set_2(P: gp_Pnt, D: gp_Dir): void;
  Update_1(aXmin: Standard_Real, aYmin: Standard_Real, aZmin: Standard_Real, aXmax: Standard_Real, aYmax: Standard_Real, aZmax: Standard_Real): void;
  Update_2(X: Standard_Real, Y: Standard_Real, Z: Standard_Real): void;
  GetGap(): Standard_Real;
  SetGap(Tol: Standard_Real): void;
  Enlarge(Tol: Standard_Real): void;
  Get(theXmin: Standard_Real, theYmin: Standard_Real, theZmin: Standard_Real, theXmax: Standard_Real, theYmax: Standard_Real, theZmax: Standard_Real): void;
  CornerMin(): gp_Pnt;
  CornerMax(): gp_Pnt;
  OpenXmin(): void;
  OpenXmax(): void;
  OpenYmin(): void;
  OpenYmax(): void;
  OpenZmin(): void;
  OpenZmax(): void;
  IsOpen(): Standard_Boolean;
  IsOpenXmin(): Standard_Boolean;
  IsOpenXmax(): Standard_Boolean;
  IsOpenYmin(): Standard_Boolean;
  IsOpenYmax(): Standard_Boolean;
  IsOpenZmin(): Standard_Boolean;
  IsOpenZmax(): Standard_Boolean;
  IsWhole(): Standard_Boolean;
  IsVoid(): Standard_Boolean;
  IsXThin(tol: Standard_Real): Standard_Boolean;
  IsYThin(tol: Standard_Real): Standard_Boolean;
  IsZThin(tol: Standard_Real): Standard_Boolean;
  IsThin(tol: Standard_Real): Standard_Boolean;
  Transformed(T: gp_Trsf): Bnd_Box;
  Add_1(Other: Bnd_Box): void;
  Add_2(P: gp_Pnt): void;
  Add_3(P: gp_Pnt, D: gp_Dir): void;
  Add_4(D: gp_Dir): void;
  IsOut_1(P: gp_Pnt): Standard_Boolean;
  IsOut_2(L: gp_Lin): Standard_Boolean;
  IsOut_3(P: gp_Pln): Standard_Boolean;
  IsOut_4(Other: Bnd_Box): Standard_Boolean;
  IsOut_5(Other: Bnd_Box, T: gp_Trsf): Standard_Boolean;
  IsOut_6(T1: gp_Trsf, Other: Bnd_Box, T2: gp_Trsf): Standard_Boolean;
  IsOut_7(P1: gp_Pnt, P2: gp_Pnt, D: gp_Dir): Standard_Boolean;
  Distance(Other: Bnd_Box): Standard_Real;
  Dump(): void;
  SquareExtent(): Standard_Real;
  FinitePart(): Bnd_Box;
  HasFinitePart(): Standard_Boolean;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  InitFromJson(theSStream: Standard_SStream, theStreamPos: Graphic3d_ZLayerId): Standard_Boolean;
  delete(): void;
}

  export declare class Bnd_Box_1 extends Bnd_Box {
    constructor();
  }

  export declare class Bnd_Box_2 extends Bnd_Box {
    constructor(theMin: gp_Pnt, theMax: gp_Pnt);
  }

export declare type BOPAlgo_GlueEnum = {
  BOPAlgo_GlueOff: {};
  BOPAlgo_GlueShift: {};
  BOPAlgo_GlueFull: {};
}

export declare class Handle_GeomFill_Boundary {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: GeomFill_Boundary): void;
  get(): GeomFill_Boundary;
  delete(): void;
}

  export declare class Handle_GeomFill_Boundary_1 extends Handle_GeomFill_Boundary {
    constructor();
  }

  export declare class Handle_GeomFill_Boundary_2 extends Handle_GeomFill_Boundary {
    constructor(thePtr: GeomFill_Boundary);
  }

  export declare class Handle_GeomFill_Boundary_3 extends Handle_GeomFill_Boundary {
    constructor(theHandle: Handle_GeomFill_Boundary);
  }

  export declare class Handle_GeomFill_Boundary_4 extends Handle_GeomFill_Boundary {
    constructor(theHandle: Handle_GeomFill_Boundary);
  }

export declare class GeomFill_ConstrainedFilling {
  constructor(MaxDeg: Graphic3d_ZLayerId, MaxSeg: Graphic3d_ZLayerId)
  Init_1(B1: Handle_GeomFill_Boundary, B2: Handle_GeomFill_Boundary, B3: Handle_GeomFill_Boundary, NoCheck: Standard_Boolean): void;
  Init_2(B1: Handle_GeomFill_Boundary, B2: Handle_GeomFill_Boundary, B3: Handle_GeomFill_Boundary, B4: Handle_GeomFill_Boundary, NoCheck: Standard_Boolean): void;
  SetDomain(l: Standard_Real, B: Handle_GeomFill_BoundWithSurf): void;
  ReBuild(): void;
  Boundary(I: Graphic3d_ZLayerId): Handle_GeomFill_Boundary;
  Surface(): Handle_Geom_BSplineSurface;
  Eval(W: Standard_Real, Ord: Graphic3d_ZLayerId, Result: Standard_Real): Graphic3d_ZLayerId;
  CheckCoonsAlgPatch(I: Graphic3d_ZLayerId): void;
  CheckTgteField(I: Graphic3d_ZLayerId): void;
  CheckApprox(I: Graphic3d_ZLayerId): void;
  CheckResult(I: Graphic3d_ZLayerId): void;
  delete(): void;
}

export declare class GeomFill_SimpleBound extends GeomFill_Boundary {
  constructor(Curve: Handle_Adaptor3d_Curve, Tol3d: Standard_Real, Tolang: Standard_Real)
  Value(U: Standard_Real): gp_Pnt;
  D1(U: Standard_Real, P: gp_Pnt, V: gp_Vec): void;
  Reparametrize(First: Standard_Real, Last: Standard_Real, HasDF: Standard_Boolean, HasDL: Standard_Boolean, DF: Standard_Real, DL: Standard_Real, Rev: Standard_Boolean): void;
  Bounds(First: Standard_Real, Last: Standard_Real): void;
  IsDegenerated(): Standard_Boolean;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class BRepPrimAPI_MakeCylinder extends BRepPrimAPI_MakeOneAxis {
  OneAxis(): Standard_Address;
  Cylinder(): BRepPrim_Cylinder;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeCylinder_1 extends BRepPrimAPI_MakeCylinder {
    constructor(R: Standard_Real, H: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCylinder_2 extends BRepPrimAPI_MakeCylinder {
    constructor(R: Standard_Real, H: Standard_Real, Angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCylinder_3 extends BRepPrimAPI_MakeCylinder {
    constructor(Axes: gp_Ax2, R: Standard_Real, H: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCylinder_4 extends BRepPrimAPI_MakeCylinder {
    constructor(Axes: gp_Ax2, R: Standard_Real, H: Standard_Real, Angle: Standard_Real);
  }

export declare class BRepPrimAPI_MakeOneAxis extends BRepBuilderAPI_MakeShape {
  OneAxis(): Standard_Address;
  Build(theRange: Message_ProgressRange): void;
  Face(): TopoDS_Face;
  Shell(): TopoDS_Shell;
  Solid(): TopoDS_Solid;
  delete(): void;
}

export declare class BRepPrimAPI_MakeSweep extends BRepBuilderAPI_MakeShape {
  FirstShape(): TopoDS_Shape;
  LastShape(): TopoDS_Shape;
  delete(): void;
}

export declare class BRepPrimAPI_MakeBox extends BRepBuilderAPI_MakeShape {
  Init_1(theDX: Standard_Real, theDY: Standard_Real, theDZ: Standard_Real): void;
  Init_2(thePnt: gp_Pnt, theDX: Standard_Real, theDY: Standard_Real, theDZ: Standard_Real): void;
  Init_3(thePnt1: gp_Pnt, thePnt2: gp_Pnt): void;
  Init_4(theAxes: gp_Ax2, theDX: Standard_Real, theDY: Standard_Real, theDZ: Standard_Real): void;
  Wedge(): BRepPrim_Wedge;
  Build(theRange: Message_ProgressRange): void;
  Shell(): TopoDS_Shell;
  Solid(): TopoDS_Solid;
  BottomFace(): TopoDS_Face;
  BackFace(): TopoDS_Face;
  FrontFace(): TopoDS_Face;
  LeftFace(): TopoDS_Face;
  RightFace(): TopoDS_Face;
  TopFace(): TopoDS_Face;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeBox_1 extends BRepPrimAPI_MakeBox {
    constructor();
  }

  export declare class BRepPrimAPI_MakeBox_2 extends BRepPrimAPI_MakeBox {
    constructor(dx: Standard_Real, dy: Standard_Real, dz: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeBox_3 extends BRepPrimAPI_MakeBox {
    constructor(P: gp_Pnt, dx: Standard_Real, dy: Standard_Real, dz: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeBox_4 extends BRepPrimAPI_MakeBox {
    constructor(P1: gp_Pnt, P2: gp_Pnt);
  }

  export declare class BRepPrimAPI_MakeBox_5 extends BRepPrimAPI_MakeBox {
    constructor(Axes: gp_Ax2, dx: Standard_Real, dy: Standard_Real, dz: Standard_Real);
  }

export declare class BRepPrimAPI_MakeCone extends BRepPrimAPI_MakeOneAxis {
  OneAxis(): Standard_Address;
  Cone(): BRepPrim_Cone;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeCone_1 extends BRepPrimAPI_MakeCone {
    constructor(R1: Standard_Real, R2: Standard_Real, H: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCone_2 extends BRepPrimAPI_MakeCone {
    constructor(R1: Standard_Real, R2: Standard_Real, H: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCone_3 extends BRepPrimAPI_MakeCone {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real, H: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeCone_4 extends BRepPrimAPI_MakeCone {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real, H: Standard_Real, angle: Standard_Real);
  }

export declare class BRepPrimAPI_MakeTorus extends BRepPrimAPI_MakeOneAxis {
  OneAxis(): Standard_Address;
  Torus(): BRepPrim_Torus;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeTorus_1 extends BRepPrimAPI_MakeTorus {
    constructor(R1: Standard_Real, R2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_2 extends BRepPrimAPI_MakeTorus {
    constructor(R1: Standard_Real, R2: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_3 extends BRepPrimAPI_MakeTorus {
    constructor(R1: Standard_Real, R2: Standard_Real, angle1: Standard_Real, angle2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_4 extends BRepPrimAPI_MakeTorus {
    constructor(R1: Standard_Real, R2: Standard_Real, angle1: Standard_Real, angle2: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_5 extends BRepPrimAPI_MakeTorus {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_6 extends BRepPrimAPI_MakeTorus {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_7 extends BRepPrimAPI_MakeTorus {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real, angle1: Standard_Real, angle2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeTorus_8 extends BRepPrimAPI_MakeTorus {
    constructor(Axes: gp_Ax2, R1: Standard_Real, R2: Standard_Real, angle1: Standard_Real, angle2: Standard_Real, angle: Standard_Real);
  }

export declare class BRepPrimAPI_MakePrism extends BRepPrimAPI_MakeSweep {
  Prism(): BRepSweep_Prism;
  Build(theRange: Message_ProgressRange): void;
  FirstShape_1(): TopoDS_Shape;
  LastShape_1(): TopoDS_Shape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  FirstShape_2(theShape: TopoDS_Shape): TopoDS_Shape;
  LastShape_2(theShape: TopoDS_Shape): TopoDS_Shape;
  delete(): void;
}

  export declare class BRepPrimAPI_MakePrism_1 extends BRepPrimAPI_MakePrism {
    constructor(S: TopoDS_Shape, V: gp_Vec, Copy: Standard_Boolean, Canonize: Standard_Boolean);
  }

  export declare class BRepPrimAPI_MakePrism_2 extends BRepPrimAPI_MakePrism {
    constructor(S: TopoDS_Shape, D: gp_Dir, Inf: Standard_Boolean, Copy: Standard_Boolean, Canonize: Standard_Boolean);
  }

export declare class BRepPrimAPI_MakeRevol extends BRepPrimAPI_MakeSweep {
  Revol(): BRepSweep_Revol;
  Build(theRange: Message_ProgressRange): void;
  FirstShape_1(): TopoDS_Shape;
  LastShape_1(): TopoDS_Shape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  FirstShape_2(theShape: TopoDS_Shape): TopoDS_Shape;
  LastShape_2(theShape: TopoDS_Shape): TopoDS_Shape;
  HasDegenerated(): Standard_Boolean;
  Degenerated(): TopTools_ListOfShape;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeRevol_1 extends BRepPrimAPI_MakeRevol {
    constructor(S: TopoDS_Shape, A: gp_Ax1, D: Standard_Real, Copy: Standard_Boolean);
  }

  export declare class BRepPrimAPI_MakeRevol_2 extends BRepPrimAPI_MakeRevol {
    constructor(S: TopoDS_Shape, A: gp_Ax1, Copy: Standard_Boolean);
  }

export declare class BRepPrimAPI_MakeRevolution extends BRepPrimAPI_MakeOneAxis {
  OneAxis(): Standard_Address;
  Revolution(): BRepPrim_Revolution;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeRevolution_1 extends BRepPrimAPI_MakeRevolution {
    constructor(Meridian: Handle_Geom_Curve);
  }

  export declare class BRepPrimAPI_MakeRevolution_2 extends BRepPrimAPI_MakeRevolution {
    constructor(Meridian: Handle_Geom_Curve, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeRevolution_3 extends BRepPrimAPI_MakeRevolution {
    constructor(Meridian: Handle_Geom_Curve, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeRevolution_4 extends BRepPrimAPI_MakeRevolution {
    constructor(Meridian: Handle_Geom_Curve, VMin: Standard_Real, VMax: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeRevolution_5 extends BRepPrimAPI_MakeRevolution {
    constructor(Axes: gp_Ax2, Meridian: Handle_Geom_Curve);
  }

  export declare class BRepPrimAPI_MakeRevolution_6 extends BRepPrimAPI_MakeRevolution {
    constructor(Axes: gp_Ax2, Meridian: Handle_Geom_Curve, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeRevolution_7 extends BRepPrimAPI_MakeRevolution {
    constructor(Axes: gp_Ax2, Meridian: Handle_Geom_Curve, VMin: Standard_Real, VMax: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeRevolution_8 extends BRepPrimAPI_MakeRevolution {
    constructor(Axes: gp_Ax2, Meridian: Handle_Geom_Curve, VMin: Standard_Real, VMax: Standard_Real, angle: Standard_Real);
  }

export declare class BRepPrimAPI_MakeSphere extends BRepPrimAPI_MakeOneAxis {
  OneAxis(): Standard_Address;
  Sphere(): BRepPrim_Sphere;
  delete(): void;
}

  export declare class BRepPrimAPI_MakeSphere_1 extends BRepPrimAPI_MakeSphere {
    constructor(R: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_2 extends BRepPrimAPI_MakeSphere {
    constructor(R: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_3 extends BRepPrimAPI_MakeSphere {
    constructor(R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_4 extends BRepPrimAPI_MakeSphere {
    constructor(R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real, angle3: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_5 extends BRepPrimAPI_MakeSphere {
    constructor(Center: gp_Pnt, R: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_6 extends BRepPrimAPI_MakeSphere {
    constructor(Center: gp_Pnt, R: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_7 extends BRepPrimAPI_MakeSphere {
    constructor(Center: gp_Pnt, R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_8 extends BRepPrimAPI_MakeSphere {
    constructor(Center: gp_Pnt, R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real, angle3: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_9 extends BRepPrimAPI_MakeSphere {
    constructor(Axis: gp_Ax2, R: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_10 extends BRepPrimAPI_MakeSphere {
    constructor(Axis: gp_Ax2, R: Standard_Real, angle: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_11 extends BRepPrimAPI_MakeSphere {
    constructor(Axis: gp_Ax2, R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real);
  }

  export declare class BRepPrimAPI_MakeSphere_12 extends BRepPrimAPI_MakeSphere {
    constructor(Axis: gp_Ax2, R: Standard_Real, angle1: Standard_Real, angle2: Standard_Real, angle3: Standard_Real);
  }

export declare class Adaptor3d_Curve extends Standard_Transient {
  constructor();
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  ShallowCopy(): Handle_Adaptor3d_Curve;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Trim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Curve;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  Value(U: Standard_Real): gp_Pnt;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  Resolution(R3d: Standard_Real): Standard_Real;
  GetType(): GeomAbs_CurveType;
  Line(): gp_Lin;
  Circle(): gp_Circ;
  Ellipse(): gp_Elips;
  Hyperbola(): gp_Hypr;
  Parabola(): gp_Parab;
  Degree(): Graphic3d_ZLayerId;
  IsRational(): Standard_Boolean;
  NbPoles(): Graphic3d_ZLayerId;
  NbKnots(): Graphic3d_ZLayerId;
  Bezier(): Handle_Geom_BezierCurve;
  BSpline(): Handle_Geom_BSplineCurve;
  OffsetCurve(): Handle_Geom_OffsetCurve;
  delete(): void;
}

export declare class Adaptor3d_Surface extends Standard_Transient {
  constructor();
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  ShallowCopy(): Handle_Adaptor3d_Surface;
  FirstUParameter(): Standard_Real;
  LastUParameter(): Standard_Real;
  FirstVParameter(): Standard_Real;
  LastVParameter(): Standard_Real;
  UContinuity(): GeomAbs_Shape;
  VContinuity(): GeomAbs_Shape;
  NbUIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  NbVIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  UIntervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  VIntervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  UTrim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Surface;
  VTrim(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real): Handle_Adaptor3d_Surface;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  UPeriod(): Standard_Real;
  IsVPeriodic(): Standard_Boolean;
  VPeriod(): Standard_Real;
  Value(U: Standard_Real, V: Standard_Real): gp_Pnt;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  UResolution(R3d: Standard_Real): Standard_Real;
  VResolution(R3d: Standard_Real): Standard_Real;
  GetType(): GeomAbs_SurfaceType;
  Plane(): gp_Pln;
  Cylinder(): gp_Cylinder;
  Cone(): gp_Cone;
  Sphere(): gp_Sphere;
  Torus(): gp_Torus;
  UDegree(): Graphic3d_ZLayerId;
  NbUPoles(): Graphic3d_ZLayerId;
  VDegree(): Graphic3d_ZLayerId;
  NbVPoles(): Graphic3d_ZLayerId;
  NbUKnots(): Graphic3d_ZLayerId;
  NbVKnots(): Graphic3d_ZLayerId;
  IsURational(): Standard_Boolean;
  IsVRational(): Standard_Boolean;
  Bezier(): Handle_Geom_BezierSurface;
  BSpline(): Handle_Geom_BSplineSurface;
  AxeOfRevolution(): gp_Ax1;
  Direction(): gp_Dir;
  BasisCurve(): Handle_Adaptor3d_Curve;
  BasisSurface(): Handle_Adaptor3d_Surface;
  OffsetValue(): Standard_Real;
  delete(): void;
}

export declare type BRepOffset_Mode = {
  BRepOffset_Skin: {};
  BRepOffset_Pipe: {};
  BRepOffset_RectoVerso: {};
}

export declare class TopTools_ListOfShape extends NCollection_BaseList {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Size(): Standard_Integer;
  Assign(theOther: TopTools_ListOfShape): TopTools_ListOfShape;
  Clear(theAllocator: Handle_NCollection_BaseAllocator): void;
  First_1(): TopoDS_Shape;
  First_2(): TopoDS_Shape;
  Last_1(): TopoDS_Shape;
  Last_2(): TopoDS_Shape;
  Append_1(theItem: TopoDS_Shape): TopoDS_Shape;
  Append_3(theOther: TopTools_ListOfShape): void;
  Prepend_1(theItem: TopoDS_Shape): TopoDS_Shape;
  Prepend_2(theOther: TopTools_ListOfShape): void;
  RemoveFirst(): void;
  Reverse(): void;
  delete(): void;
}

  export declare class TopTools_ListOfShape_1 extends TopTools_ListOfShape {
    constructor();
  }

  export declare class TopTools_ListOfShape_2 extends TopTools_ListOfShape {
    constructor(theAllocator: Handle_NCollection_BaseAllocator);
  }

  export declare class TopTools_ListOfShape_3 extends TopTools_ListOfShape {
    constructor(theOther: TopTools_ListOfShape);
  }

export declare type TopAbs_ShapeEnum = {
  TopAbs_COMPOUND: {};
  TopAbs_COMPSOLID: {};
  TopAbs_SOLID: {};
  TopAbs_SHELL: {};
  TopAbs_FACE: {};
  TopAbs_WIRE: {};
  TopAbs_EDGE: {};
  TopAbs_VERTEX: {};
  TopAbs_SHAPE: {};
}

export declare type TopAbs_Orientation = {
  TopAbs_FORWARD: {};
  TopAbs_REVERSED: {};
  TopAbs_INTERNAL: {};
  TopAbs_EXTERNAL: {};
}

export declare class BRepAlgoAPI_Common extends BRepAlgoAPI_BooleanOperation {
  delete(): void;
}

  export declare class BRepAlgoAPI_Common_1 extends BRepAlgoAPI_Common {
    constructor();
  }

  export declare class BRepAlgoAPI_Common_2 extends BRepAlgoAPI_Common {
    constructor(PF: BOPAlgo_PaveFiller);
  }

  export declare class BRepAlgoAPI_Common_3 extends BRepAlgoAPI_Common {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, theRange: Message_ProgressRange);
  }

  export declare class BRepAlgoAPI_Common_4 extends BRepAlgoAPI_Common {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, PF: BOPAlgo_PaveFiller, theRange: Message_ProgressRange);
  }

export declare class BRepAlgoAPI_Algo extends BRepBuilderAPI_MakeShape {
  Shape(): TopoDS_Shape;
  Clear(): void;
  SetRunParallel(theFlag: Standard_Boolean): void;
  RunParallel(): Standard_Boolean;
  SetFuzzyValue(theFuzz: Standard_Real): void;
  FuzzyValue(): Standard_Real;
  HasErrors(): Standard_Boolean;
  HasWarnings(): Standard_Boolean;
  HasError(theType: Handle_Standard_Type): Standard_Boolean;
  HasWarning(theType: Handle_Standard_Type): Standard_Boolean;
  DumpErrors(theOS: Standard_OStream): void;
  DumpWarnings(theOS: Standard_OStream): void;
  ClearWarnings(): void;
  GetReport(): Handle_Message_Report;
  SetUseOBB(theUseOBB: Standard_Boolean): void;
  delete(): void;
}

export declare class BRepAlgoAPI_Cut extends BRepAlgoAPI_BooleanOperation {
  delete(): void;
}

  export declare class BRepAlgoAPI_Cut_1 extends BRepAlgoAPI_Cut {
    constructor();
  }

  export declare class BRepAlgoAPI_Cut_2 extends BRepAlgoAPI_Cut {
    constructor(PF: BOPAlgo_PaveFiller);
  }

  export declare class BRepAlgoAPI_Cut_3 extends BRepAlgoAPI_Cut {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, theRange: Message_ProgressRange);
  }

  export declare class BRepAlgoAPI_Cut_4 extends BRepAlgoAPI_Cut {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, aDSF: BOPAlgo_PaveFiller, bFWD: Standard_Boolean, theRange: Message_ProgressRange);
  }

export declare class BRepAlgoAPI_BuilderAlgo extends BRepAlgoAPI_Algo {
  SetArguments(theLS: TopTools_ListOfShape): void;
  Arguments(): TopTools_ListOfShape;
  SetNonDestructive(theFlag: Standard_Boolean): void;
  NonDestructive(): Standard_Boolean;
  SetGlue(theGlue: BOPAlgo_GlueEnum): void;
  Glue(): BOPAlgo_GlueEnum;
  SetCheckInverted(theCheck: Standard_Boolean): void;
  CheckInverted(): Standard_Boolean;
  Build(theRange: Message_ProgressRange): void;
  SimplifyResult(theUnifyEdges: Standard_Boolean, theUnifyFaces: Standard_Boolean, theAngularTol: Standard_Real): void;
  Modified(theS: TopoDS_Shape): TopTools_ListOfShape;
  Generated(theS: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(aS: TopoDS_Shape): Standard_Boolean;
  HasModified(): Standard_Boolean;
  HasGenerated(): Standard_Boolean;
  HasDeleted(): Standard_Boolean;
  SetToFillHistory(theHistFlag: Standard_Boolean): void;
  HasHistory(): Standard_Boolean;
  SectionEdges(): TopTools_ListOfShape;
  DSFiller(): BOPAlgo_PPaveFiller;
  Builder(): BOPAlgo_PBuilder;
  History(): Handle_BRepTools_History;
  delete(): void;
}

  export declare class BRepAlgoAPI_BuilderAlgo_1 extends BRepAlgoAPI_BuilderAlgo {
    constructor();
  }

  export declare class BRepAlgoAPI_BuilderAlgo_2 extends BRepAlgoAPI_BuilderAlgo {
    constructor(thePF: BOPAlgo_PaveFiller);
  }

export declare class BRepAlgoAPI_Fuse extends BRepAlgoAPI_BooleanOperation {
  delete(): void;
}

  export declare class BRepAlgoAPI_Fuse_1 extends BRepAlgoAPI_Fuse {
    constructor();
  }

  export declare class BRepAlgoAPI_Fuse_2 extends BRepAlgoAPI_Fuse {
    constructor(PF: BOPAlgo_PaveFiller);
  }

  export declare class BRepAlgoAPI_Fuse_3 extends BRepAlgoAPI_Fuse {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, theRange: Message_ProgressRange);
  }

  export declare class BRepAlgoAPI_Fuse_4 extends BRepAlgoAPI_Fuse {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, aDSF: BOPAlgo_PaveFiller, theRange: Message_ProgressRange);
  }

export declare class BRepAlgoAPI_BooleanOperation extends BRepAlgoAPI_BuilderAlgo {
  Shape1(): TopoDS_Shape;
  Shape2(): TopoDS_Shape;
  SetTools(theLS: TopTools_ListOfShape): void;
  Tools(): TopTools_ListOfShape;
  SetOperation(theBOP: BOPAlgo_Operation): void;
  Operation(): BOPAlgo_Operation;
  Build(theRange: Message_ProgressRange): void;
  delete(): void;
}

  export declare class BRepAlgoAPI_BooleanOperation_1 extends BRepAlgoAPI_BooleanOperation {
    constructor();
  }

  export declare class BRepAlgoAPI_BooleanOperation_2 extends BRepAlgoAPI_BooleanOperation {
    constructor(thePF: BOPAlgo_PaveFiller);
  }

export declare class BRepAlgoAPI_Section extends BRepAlgoAPI_BooleanOperation {
  Init1_1(S1: TopoDS_Shape): void;
  Init1_2(Pl: gp_Pln): void;
  Init1_3(Sf: Handle_Geom_Surface): void;
  Init2_1(S2: TopoDS_Shape): void;
  Init2_2(Pl: gp_Pln): void;
  Init2_3(Sf: Handle_Geom_Surface): void;
  Approximation(B: Standard_Boolean): void;
  ComputePCurveOn1(B: Standard_Boolean): void;
  ComputePCurveOn2(B: Standard_Boolean): void;
  Build(theRange: Message_ProgressRange): void;
  HasAncestorFaceOn1(E: TopoDS_Shape, F: TopoDS_Shape): Standard_Boolean;
  HasAncestorFaceOn2(E: TopoDS_Shape, F: TopoDS_Shape): Standard_Boolean;
  delete(): void;
}

  export declare class BRepAlgoAPI_Section_1 extends BRepAlgoAPI_Section {
    constructor();
  }

  export declare class BRepAlgoAPI_Section_2 extends BRepAlgoAPI_Section {
    constructor(PF: BOPAlgo_PaveFiller);
  }

  export declare class BRepAlgoAPI_Section_3 extends BRepAlgoAPI_Section {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, PerformNow: Standard_Boolean);
  }

  export declare class BRepAlgoAPI_Section_4 extends BRepAlgoAPI_Section {
    constructor(S1: TopoDS_Shape, S2: TopoDS_Shape, aDSF: BOPAlgo_PaveFiller, PerformNow: Standard_Boolean);
  }

  export declare class BRepAlgoAPI_Section_5 extends BRepAlgoAPI_Section {
    constructor(S1: TopoDS_Shape, Pl: gp_Pln, PerformNow: Standard_Boolean);
  }

  export declare class BRepAlgoAPI_Section_6 extends BRepAlgoAPI_Section {
    constructor(S1: TopoDS_Shape, Sf: Handle_Geom_Surface, PerformNow: Standard_Boolean);
  }

  export declare class BRepAlgoAPI_Section_7 extends BRepAlgoAPI_Section {
    constructor(Sf: Handle_Geom_Surface, S2: TopoDS_Shape, PerformNow: Standard_Boolean);
  }

  export declare class BRepAlgoAPI_Section_8 extends BRepAlgoAPI_Section {
    constructor(Sf1: Handle_Geom_Surface, Sf2: Handle_Geom_Surface, PerformNow: Standard_Boolean);
  }

export declare class Law_Function extends Standard_Transient {
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Value(X: Standard_Real): Standard_Real;
  D1(X: Standard_Real, F: Standard_Real, D: Standard_Real): void;
  D2(X: Standard_Real, F: Standard_Real, D: Standard_Real, D2: Standard_Real): void;
  Trim(PFirst: Standard_Real, PLast: Standard_Real, Tol: Standard_Real): Handle_Law_Function;
  Bounds(PFirst: Standard_Real, PLast: Standard_Real): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Handle_Law_Function {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Law_Function): void;
  get(): Law_Function;
  delete(): void;
}

  export declare class Handle_Law_Function_1 extends Handle_Law_Function {
    constructor();
  }

  export declare class Handle_Law_Function_2 extends Handle_Law_Function {
    constructor(thePtr: Law_Function);
  }

  export declare class Handle_Law_Function_3 extends Handle_Law_Function {
    constructor(theHandle: Handle_Law_Function);
  }

  export declare class Handle_Law_Function_4 extends Handle_Law_Function {
    constructor(theHandle: Handle_Law_Function);
  }

export declare class Law_BSpFunc extends Law_Function {
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Value(X: Standard_Real): Standard_Real;
  D1(X: Standard_Real, F: Standard_Real, D: Standard_Real): void;
  D2(X: Standard_Real, F: Standard_Real, D: Standard_Real, D2: Standard_Real): void;
  Trim(PFirst: Standard_Real, PLast: Standard_Real, Tol: Standard_Real): Handle_Law_Function;
  Bounds(PFirst: Standard_Real, PLast: Standard_Real): void;
  Curve(): Handle_Law_BSpline;
  SetCurve(C: Handle_Law_BSpline): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Law_BSpFunc_1 extends Law_BSpFunc {
    constructor();
  }

  export declare class Law_BSpFunc_2 extends Law_BSpFunc {
    constructor(C: Handle_Law_BSpline, First: Standard_Real, Last: Standard_Real);
  }

export declare class Law_Interpol extends Law_BSpFunc {
  constructor()
  Set_1(ParAndRad: TColgp_Array1OfPnt2d, Periodic: Standard_Boolean): void;
  SetInRelative_1(ParAndRad: TColgp_Array1OfPnt2d, Ud: Standard_Real, Uf: Standard_Real, Periodic: Standard_Boolean): void;
  Set_2(ParAndRad: TColgp_Array1OfPnt2d, Dd: Standard_Real, Df: Standard_Real, Periodic: Standard_Boolean): void;
  SetInRelative_2(ParAndRad: TColgp_Array1OfPnt2d, Ud: Standard_Real, Uf: Standard_Real, Dd: Standard_Real, Df: Standard_Real, Periodic: Standard_Boolean): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Law_Linear extends Law_Function {
  constructor()
  Set(Pdeb: Standard_Real, Valdeb: Standard_Real, Pfin: Standard_Real, Valfin: Standard_Real): void;
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Value(X: Standard_Real): Standard_Real;
  D1(X: Standard_Real, F: Standard_Real, D: Standard_Real): void;
  D2(X: Standard_Real, F: Standard_Real, D: Standard_Real, D2: Standard_Real): void;
  Trim(PFirst: Standard_Real, PLast: Standard_Real, Tol: Standard_Real): Handle_Law_Function;
  Bounds(PFirst: Standard_Real, PLast: Standard_Real): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Law_S extends Law_BSpFunc {
  constructor()
  Set_1(Pdeb: Standard_Real, Valdeb: Standard_Real, Pfin: Standard_Real, Valfin: Standard_Real): void;
  Set_2(Pdeb: Standard_Real, Valdeb: Standard_Real, Ddeb: Standard_Real, Pfin: Standard_Real, Valfin: Standard_Real, Dfin: Standard_Real): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Law_Composite extends Law_Function {
  Continuity(): GeomAbs_Shape;
  NbIntervals(S: GeomAbs_Shape): Graphic3d_ZLayerId;
  Intervals(T: IntTools_CArray1OfReal, S: GeomAbs_Shape): void;
  Value(X: Standard_Real): Standard_Real;
  D1(X: Standard_Real, F: Standard_Real, D: Standard_Real): void;
  D2(X: Standard_Real, F: Standard_Real, D: Standard_Real, D2: Standard_Real): void;
  Trim(PFirst: Standard_Real, PLast: Standard_Real, Tol: Standard_Real): Handle_Law_Function;
  Bounds(PFirst: Standard_Real, PLast: Standard_Real): void;
  ChangeElementaryLaw(W: Standard_Real): Handle_Law_Function;
  ChangeLaws(): Law_Laws;
  IsPeriodic(): Standard_Boolean;
  SetPeriodic(): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Law_Composite_1 extends Law_Composite {
    constructor();
  }

  export declare class Law_Composite_2 extends Law_Composite {
    constructor(First: Standard_Real, Last: Standard_Real, Tol: Standard_Real);
  }

export declare class IntTools_EdgeEdge {
  SetEdge1_1(theEdge: TopoDS_Edge): void;
  SetEdge1_2(theEdge: TopoDS_Edge, aT1: Standard_Real, aT2: Standard_Real): void;
  SetRange1_1(theRange1: IntTools_Range): void;
  SetRange1_2(aT1: Standard_Real, aT2: Standard_Real): void;
  SetEdge2_1(theEdge: TopoDS_Edge): void;
  SetEdge2_2(theEdge: TopoDS_Edge, aT1: Standard_Real, aT2: Standard_Real): void;
  SetRange2_1(theRange: IntTools_Range): void;
  SetRange2_2(aT1: Standard_Real, aT2: Standard_Real): void;
  SetFuzzyValue(theFuzz: Standard_Real): void;
  Perform(): void;
  IsDone(): Standard_Boolean;
  FuzzyValue(): Standard_Real;
  CommonParts(): IntTools_SequenceOfCommonPrts;
  UseQuickCoincidenceCheck(bFlag: Standard_Boolean): void;
  IsCoincidenceCheckedQuickly(): Standard_Boolean;
  delete(): void;
}

  export declare class IntTools_EdgeEdge_1 extends IntTools_EdgeEdge {
    constructor();
  }

  export declare class IntTools_EdgeEdge_2 extends IntTools_EdgeEdge {
    constructor(theEdge1: TopoDS_Edge, theEdge2: TopoDS_Edge);
  }

  export declare class IntTools_EdgeEdge_3 extends IntTools_EdgeEdge {
    constructor(theEdge1: TopoDS_Edge, aT11: Standard_Real, aT12: Standard_Real, theEdge2: TopoDS_Edge, aT21: Standard_Real, aT22: Standard_Real);
  }

export declare class IntTools_FaceFace {
  constructor()
  SetParameters(ApproxCurves: Standard_Boolean, ComputeCurveOnS1: Standard_Boolean, ComputeCurveOnS2: Standard_Boolean, ApproximationTolerance: Standard_Real): void;
  Perform(F1: TopoDS_Face, F2: TopoDS_Face, theToRunParallel: Standard_Boolean): void;
  IsDone(): Standard_Boolean;
  Lines(): IntTools_SequenceOfCurves;
  Points(): IntTools_SequenceOfPntOn2Faces;
  Face1(): TopoDS_Face;
  Face2(): TopoDS_Face;
  TangentFaces(): Standard_Boolean;
  PrepareLines3D(bToSplit: Standard_Boolean): void;
  SetList(ListOfPnts: IntSurf_ListOfPntOn2S): void;
  SetContext(aContext: Handle_IntTools_Context): void;
  SetFuzzyValue(theFuzz: Standard_Real): void;
  FuzzyValue(): Standard_Real;
  Context(): Handle_IntTools_Context;
  delete(): void;
}

export declare class BRepExtrema_DistShapeShape {
  SetDeflection(theDeflection: Standard_Real): void;
  LoadS1(Shape1: TopoDS_Shape): void;
  LoadS2(Shape1: TopoDS_Shape): void;
  Perform(theRange: Message_ProgressRange): Standard_Boolean;
  IsDone(): Standard_Boolean;
  NbSolution(): Graphic3d_ZLayerId;
  Value(): Standard_Real;
  InnerSolution(): Standard_Boolean;
  PointOnShape1(N: Graphic3d_ZLayerId): gp_Pnt;
  PointOnShape2(N: Graphic3d_ZLayerId): gp_Pnt;
  SupportTypeShape1(N: Graphic3d_ZLayerId): BRepExtrema_SupportType;
  SupportTypeShape2(N: Graphic3d_ZLayerId): BRepExtrema_SupportType;
  SupportOnShape1(N: Graphic3d_ZLayerId): TopoDS_Shape;
  SupportOnShape2(N: Graphic3d_ZLayerId): TopoDS_Shape;
  ParOnEdgeS1(N: Graphic3d_ZLayerId, t: Standard_Real): void;
  ParOnEdgeS2(N: Graphic3d_ZLayerId, t: Standard_Real): void;
  ParOnFaceS1(N: Graphic3d_ZLayerId, u: Standard_Real, v: Standard_Real): void;
  ParOnFaceS2(N: Graphic3d_ZLayerId, u: Standard_Real, v: Standard_Real): void;
  Dump(o: Standard_OStream): void;
  SetFlag(F: Extrema_ExtFlag): void;
  SetAlgo(A: Extrema_ExtAlgo): void;
  SetMultiThread(theIsMultiThread: Standard_Boolean): void;
  IsMultiThread(): Standard_Boolean;
  delete(): void;
}

  export declare class BRepExtrema_DistShapeShape_1 extends BRepExtrema_DistShapeShape {
    constructor();
  }

  export declare class BRepExtrema_DistShapeShape_2 extends BRepExtrema_DistShapeShape {
    constructor(Shape1: TopoDS_Shape, Shape2: TopoDS_Shape, F: Extrema_ExtFlag, A: Extrema_ExtAlgo, theRange: Message_ProgressRange);
  }

  export declare class BRepExtrema_DistShapeShape_3 extends BRepExtrema_DistShapeShape {
    constructor(Shape1: TopoDS_Shape, Shape2: TopoDS_Shape, theDeflection: Standard_Real, F: Extrema_ExtFlag, A: Extrema_ExtAlgo, theRange: Message_ProgressRange);
  }

export declare class BRepOffsetAPI_MakePipe extends BRepPrimAPI_MakeSweep {
  Pipe(): BRepFill_Pipe;
  Build(theRange: Message_ProgressRange): void;
  FirstShape(): TopoDS_Shape;
  LastShape(): TopoDS_Shape;
  Generated_1(S: TopoDS_Shape): TopTools_ListOfShape;
  Generated_2(SSpine: TopoDS_Shape, SProfile: TopoDS_Shape): TopoDS_Shape;
  ErrorOnSurface(): Standard_Real;
  delete(): void;
}

  export declare class BRepOffsetAPI_MakePipe_1 extends BRepOffsetAPI_MakePipe {
    constructor(Spine: TopoDS_Wire, Profile: TopoDS_Shape);
  }

  export declare class BRepOffsetAPI_MakePipe_2 extends BRepOffsetAPI_MakePipe {
    constructor(Spine: TopoDS_Wire, Profile: TopoDS_Shape, aMode: GeomFill_Trihedron, ForceApproxC1: Standard_Boolean);
  }

export declare class BRepOffsetAPI_MakePipeShell extends BRepPrimAPI_MakeSweep {
  constructor(Spine: TopoDS_Wire)
  SetMode_1(IsFrenet: Standard_Boolean): void;
  SetDiscreteMode(): void;
  SetMode_2(Axe: gp_Ax2): void;
  SetMode_3(BiNormal: gp_Dir): void;
  SetMode_4(SpineSupport: TopoDS_Shape): Standard_Boolean;
  SetMode_5(AuxiliarySpine: TopoDS_Wire, CurvilinearEquivalence: Standard_Boolean, KeepContact: BRepFill_TypeOfContact): void;
  Add_1(Profile: TopoDS_Shape, WithContact: Standard_Boolean, WithCorrection: Standard_Boolean): void;
  Add_2(Profile: TopoDS_Shape, Location: TopoDS_Vertex, WithContact: Standard_Boolean, WithCorrection: Standard_Boolean): void;
  SetLaw_1(Profile: TopoDS_Shape, L: Handle_Law_Function, WithContact: Standard_Boolean, WithCorrection: Standard_Boolean): void;
  SetLaw_2(Profile: TopoDS_Shape, L: Handle_Law_Function, Location: TopoDS_Vertex, WithContact: Standard_Boolean, WithCorrection: Standard_Boolean): void;
  Delete(Profile: TopoDS_Shape): void;
  IsReady(): Standard_Boolean;
  GetStatus(): BRepBuilderAPI_PipeError;
  SetTolerance(Tol3d: Standard_Real, BoundTol: Standard_Real, TolAngular: Standard_Real): void;
  SetMaxDegree(NewMaxDegree: Graphic3d_ZLayerId): void;
  SetMaxSegments(NewMaxSegments: Graphic3d_ZLayerId): void;
  SetForceApproxC1(ForceApproxC1: Standard_Boolean): void;
  SetTransitionMode(Mode: BRepBuilderAPI_TransitionMode): void;
  Simulate(NumberOfSection: Graphic3d_ZLayerId, Result: TopTools_ListOfShape): void;
  Build(theRange: Message_ProgressRange): void;
  MakeSolid(): Standard_Boolean;
  FirstShape(): TopoDS_Shape;
  LastShape(): TopoDS_Shape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  ErrorOnSurface(): Standard_Real;
  Profiles(theProfiles: TopTools_ListOfShape): void;
  Spine(): TopoDS_Wire;
  delete(): void;
}

export declare class BRepOffsetAPI_MakeOffsetShape extends BRepBuilderAPI_MakeShape {
  constructor()
  PerformBySimple(theS: TopoDS_Shape, theOffsetValue: Standard_Real): void;
  PerformByJoin(S: TopoDS_Shape, Offset: Standard_Real, Tol: Standard_Real, Mode: BRepOffset_Mode, Intersection: Standard_Boolean, SelfInter: Standard_Boolean, Join: GeomAbs_JoinType, RemoveIntEdges: Standard_Boolean, theRange: Message_ProgressRange): void;
  MakeOffset(): BRepOffset_MakeOffset;
  Build(theRange: Message_ProgressRange): void;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  Modified(S: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  GetJoinType(): GeomAbs_JoinType;
  delete(): void;
}

export declare class BRepOffsetAPI_MakeThickSolid extends BRepOffsetAPI_MakeOffsetShape {
  constructor()
  MakeThickSolidBySimple(theS: TopoDS_Shape, theOffsetValue: Standard_Real): void;
  MakeThickSolidByJoin(S: TopoDS_Shape, ClosingFaces: TopTools_ListOfShape, Offset: Standard_Real, Tol: Standard_Real, Mode: BRepOffset_Mode, Intersection: Standard_Boolean, SelfInter: Standard_Boolean, Join: GeomAbs_JoinType, RemoveIntEdges: Standard_Boolean, theRange: Message_ProgressRange): void;
  Build(theRange: Message_ProgressRange): void;
  Modified(S: TopoDS_Shape): TopTools_ListOfShape;
  delete(): void;
}

export declare class BRepOffsetAPI_MakeOffset extends BRepBuilderAPI_MakeShape {
  Init_1(Spine: TopoDS_Face, Join: GeomAbs_JoinType, IsOpenResult: Standard_Boolean): void;
  Init_2(Join: GeomAbs_JoinType, IsOpenResult: Standard_Boolean): void;
  AddWire(Spine: TopoDS_Wire): void;
  Perform(Offset: Standard_Real, Alt: Standard_Real): void;
  Build(theRange: Message_ProgressRange): void;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  delete(): void;
}

  export declare class BRepOffsetAPI_MakeOffset_1 extends BRepOffsetAPI_MakeOffset {
    constructor();
  }

  export declare class BRepOffsetAPI_MakeOffset_2 extends BRepOffsetAPI_MakeOffset {
    constructor(Spine: TopoDS_Face, Join: GeomAbs_JoinType, IsOpenResult: Standard_Boolean);
  }

  export declare class BRepOffsetAPI_MakeOffset_3 extends BRepOffsetAPI_MakeOffset {
    constructor(Spine: TopoDS_Wire, Join: GeomAbs_JoinType, IsOpenResult: Standard_Boolean);
  }

export declare class BRepOffsetAPI_ThruSections extends BRepBuilderAPI_MakeShape {
  constructor(isSolid: Standard_Boolean, ruled: Standard_Boolean, pres3d: Standard_Real)
  Init(isSolid: Standard_Boolean, ruled: Standard_Boolean, pres3d: Standard_Real): void;
  AddWire(wire: TopoDS_Wire): void;
  AddVertex(aVertex: TopoDS_Vertex): void;
  CheckCompatibility(check: Standard_Boolean): void;
  SetSmoothing(UseSmoothing: Standard_Boolean): void;
  SetParType(ParType: Approx_ParametrizationType): void;
  SetContinuity(C: GeomAbs_Shape): void;
  SetCriteriumWeight(W1: Standard_Real, W2: Standard_Real, W3: Standard_Real): void;
  SetMaxDegree(MaxDeg: Graphic3d_ZLayerId): void;
  ParType(): Approx_ParametrizationType;
  Continuity(): GeomAbs_Shape;
  MaxDegree(): Graphic3d_ZLayerId;
  UseSmoothing(): Standard_Boolean;
  CriteriumWeight(W1: Standard_Real, W2: Standard_Real, W3: Standard_Real): void;
  Build(theRange: Message_ProgressRange): void;
  FirstShape(): TopoDS_Shape;
  LastShape(): TopoDS_Shape;
  GeneratedFace(Edge: TopoDS_Shape): TopoDS_Shape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  Wires(): TopTools_ListOfShape;
  delete(): void;
}

export declare class BRepOffsetAPI_MakeFilling extends BRepBuilderAPI_MakeShape {
  constructor(Degree: Graphic3d_ZLayerId, NbPtsOnCur: Graphic3d_ZLayerId, NbIter: Graphic3d_ZLayerId, Anisotropie: Standard_Boolean, Tol2d: Standard_Real, Tol3d: Standard_Real, TolAng: Standard_Real, TolCurv: Standard_Real, MaxDeg: Graphic3d_ZLayerId, MaxSegments: Graphic3d_ZLayerId)
  SetConstrParam(Tol2d: Standard_Real, Tol3d: Standard_Real, TolAng: Standard_Real, TolCurv: Standard_Real): void;
  SetResolParam(Degree: Graphic3d_ZLayerId, NbPtsOnCur: Graphic3d_ZLayerId, NbIter: Graphic3d_ZLayerId, Anisotropie: Standard_Boolean): void;
  SetApproxParam(MaxDeg: Graphic3d_ZLayerId, MaxSegments: Graphic3d_ZLayerId): void;
  LoadInitSurface(Surf: TopoDS_Face): void;
  Add_1(Constr: TopoDS_Edge, Order: GeomAbs_Shape, IsBound: Standard_Boolean): Graphic3d_ZLayerId;
  Add_2(Constr: TopoDS_Edge, Support: TopoDS_Face, Order: GeomAbs_Shape, IsBound: Standard_Boolean): Graphic3d_ZLayerId;
  Add_3(Support: TopoDS_Face, Order: GeomAbs_Shape): Graphic3d_ZLayerId;
  Add_4(Point: gp_Pnt): Graphic3d_ZLayerId;
  Add_5(U: Standard_Real, V: Standard_Real, Support: TopoDS_Face, Order: GeomAbs_Shape): Graphic3d_ZLayerId;
  Build(theRange: Message_ProgressRange): void;
  IsDone(): Standard_Boolean;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  G0Error_1(): Standard_Real;
  G1Error_1(): Standard_Real;
  G2Error_1(): Standard_Real;
  G0Error_2(Index: Graphic3d_ZLayerId): Standard_Real;
  G1Error_2(Index: Graphic3d_ZLayerId): Standard_Real;
  G2Error_2(Index: Graphic3d_ZLayerId): Standard_Real;
  delete(): void;
}

export declare class Standard_Transient {
  Delete(): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  IsInstance_1(theType: Handle_Standard_Type): Standard_Boolean;
  IsInstance_2(theTypeName: Standard_CString): Standard_Boolean;
  IsKind_1(theType: Handle_Standard_Type): Standard_Boolean;
  IsKind_2(theTypeName: Standard_CString): Standard_Boolean;
  This(): Standard_Transient;
  GetRefCount(): Graphic3d_ZLayerId;
  IncrementRefCounter(): void;
  DecrementRefCounter(): Graphic3d_ZLayerId;
  delete(): void;
}

  export declare class Standard_Transient_1 extends Standard_Transient {
    constructor();
  }

  export declare class Standard_Transient_2 extends Standard_Transient {
    constructor(a: Standard_Transient);
  }

export declare class StdPrs_ToolTriangulatedShape {
  constructor();
  static IsTriangulated(theShape: TopoDS_Shape): Standard_Boolean;
  static IsClosed(theShape: TopoDS_Shape): Standard_Boolean;
  static ComputeNormals_1(theFace: TopoDS_Face, theTris: Handle_Poly_Triangulation): void;
  static ComputeNormals_2(theFace: TopoDS_Face, theTris: Handle_Poly_Triangulation, thePolyConnect: Poly_Connect): void;
  static Normal(theFace: TopoDS_Face, thePolyConnect: Poly_Connect, theNormals: TColgp_Array1OfDir): void;
  static GetDeflection(theShape: TopoDS_Shape, theDrawer: Handle_Prs3d_Drawer): Standard_Real;
  static IsTessellated(theShape: TopoDS_Shape, theDrawer: Handle_Prs3d_Drawer): Standard_Boolean;
  static Tessellate(theShape: TopoDS_Shape, theDrawer: Handle_Prs3d_Drawer): Standard_Boolean;
  static ClearOnOwnDeflectionChange(theShape: TopoDS_Shape, theDrawer: Handle_Prs3d_Drawer, theToResetCoeff: Standard_Boolean): void;
  delete(): void;
}

export declare class STEPControl_Writer {
  SetTolerance(Tol: Standard_Real): void;
  UnsetTolerance(): void;
  SetWS(WS: Handle_XSControl_WorkSession, scratch: Standard_Boolean): void;
  WS(): Handle_XSControl_WorkSession;
  Model(newone: Standard_Boolean): Handle_StepData_StepModel;
  Transfer(sh: TopoDS_Shape, mode: STEPControl_StepModelType, compgraph: Standard_Boolean, theProgress: Message_ProgressRange): IFSelect_ReturnStatus;
  Write(filename: Standard_CString): IFSelect_ReturnStatus;
  PrintStatsTransfer(what: Graphic3d_ZLayerId, mode: Graphic3d_ZLayerId): void;
  delete(): void;
}

  export declare class STEPControl_Writer_1 extends STEPControl_Writer {
    constructor();
  }

  export declare class STEPControl_Writer_2 extends STEPControl_Writer {
    constructor(WS: Handle_XSControl_WorkSession, scratch: Standard_Boolean);
  }

export declare type STEPControl_StepModelType = {
  STEPControl_AsIs: {};
  STEPControl_ManifoldSolidBrep: {};
  STEPControl_BrepWithVoids: {};
  STEPControl_FacetedBrep: {};
  STEPControl_FacetedBrepAndBrepWithVoids: {};
  STEPControl_ShellBasedSurfaceModel: {};
  STEPControl_GeometricCurveSet: {};
  STEPControl_Hybrid: {};
}

export declare class BRepLib_FindSurface {
  Init(S: TopoDS_Shape, Tol: Standard_Real, OnlyPlane: Standard_Boolean, OnlyClosed: Standard_Boolean): void;
  Found(): Standard_Boolean;
  Surface(): Handle_Geom_Surface;
  Tolerance(): Standard_Real;
  ToleranceReached(): Standard_Real;
  Existed(): Standard_Boolean;
  Location(): TopLoc_Location;
  delete(): void;
}

  export declare class BRepLib_FindSurface_1 extends BRepLib_FindSurface {
    constructor();
  }

  export declare class BRepLib_FindSurface_2 extends BRepLib_FindSurface {
    constructor(S: TopoDS_Shape, Tol: Standard_Real, OnlyPlane: Standard_Boolean, OnlyClosed: Standard_Boolean);
  }

export declare class BRepLib {
  constructor();
  static Precision_1(P: Standard_Real): void;
  static Precision_2(): Standard_Real;
  static Plane_1(P: Handle_Geom_Plane): void;
  static Plane_2(): Handle_Geom_Plane;
  static CheckSameRange(E: TopoDS_Edge, Confusion: Standard_Real): Standard_Boolean;
  static SameRange(E: TopoDS_Edge, Tolerance: Standard_Real): void;
  static BuildCurve3d(E: TopoDS_Edge, Tolerance: Standard_Real, Continuity: GeomAbs_Shape, MaxDegree: Graphic3d_ZLayerId, MaxSegment: Graphic3d_ZLayerId): Standard_Boolean;
  static BuildCurves3d_1(S: TopoDS_Shape, Tolerance: Standard_Real, Continuity: GeomAbs_Shape, MaxDegree: Graphic3d_ZLayerId, MaxSegment: Graphic3d_ZLayerId): Standard_Boolean;
  static BuildCurves3d_2(S: TopoDS_Shape): Standard_Boolean;
  static BuildPCurveForEdgeOnPlane_1(theE: TopoDS_Edge, theF: TopoDS_Face): void;
  static BuildPCurveForEdgeOnPlane_2(theE: TopoDS_Edge, theF: TopoDS_Face, aC2D: Handle_Geom2d_Curve, bToUpdate: Standard_Boolean): void;
  static UpdateEdgeTol(E: TopoDS_Edge, MinToleranceRequest: Standard_Real, MaxToleranceToCheck: Standard_Real): Standard_Boolean;
  static UpdateEdgeTolerance(S: TopoDS_Shape, MinToleranceRequest: Standard_Real, MaxToleranceToCheck: Standard_Real): Standard_Boolean;
  static SameParameter_1(theEdge: TopoDS_Edge, Tolerance: Standard_Real): void;
  static SameParameter_2(theEdge: TopoDS_Edge, theTolerance: Standard_Real, theNewTol: Standard_Real, IsUseOldEdge: Standard_Boolean): TopoDS_Edge;
  static SameParameter_3(S: TopoDS_Shape, Tolerance: Standard_Real, forced: Standard_Boolean): void;
  static SameParameter_4(S: TopoDS_Shape, theReshaper: BRepTools_ReShape, Tolerance: Standard_Real, forced: Standard_Boolean): void;
  static UpdateTolerances_1(S: TopoDS_Shape, verifyFaceTolerance: Standard_Boolean): void;
  static UpdateTolerances_2(S: TopoDS_Shape, theReshaper: BRepTools_ReShape, verifyFaceTolerance: Standard_Boolean): void;
  static UpdateInnerTolerances(S: TopoDS_Shape): void;
  static OrientClosedSolid(solid: TopoDS_Solid): Standard_Boolean;
  static EncodeRegularity_1(S: TopoDS_Shape, TolAng: Standard_Real): void;
  static EncodeRegularity_2(S: TopoDS_Shape, LE: TopTools_ListOfShape, TolAng: Standard_Real): void;
  static EncodeRegularity_3(E: TopoDS_Edge, F1: TopoDS_Face, F2: TopoDS_Face, TolAng: Standard_Real): void;
  static SortFaces(S: TopoDS_Shape, LF: TopTools_ListOfShape): void;
  static ReverseSortFaces(S: TopoDS_Shape, LF: TopTools_ListOfShape): void;
  static EnsureNormalConsistency(S: TopoDS_Shape, theAngTol: Standard_Real, ForceComputeNormals: Standard_Boolean): Standard_Boolean;
  static UpdateDeflection(S: TopoDS_Shape): void;
  static BoundingVertex(theLV: TopoDS_ListOfShape, theNewCenter: gp_Pnt, theNewTol: Standard_Real): void;
  static FindValidRange_1(theCurve: Adaptor3d_Curve, theTolE: Standard_Real, theParV1: Standard_Real, thePntV1: gp_Pnt, theTolV1: Standard_Real, theParV2: Standard_Real, thePntV2: gp_Pnt, theTolV2: Standard_Real, theFirst: Standard_Real, theLast: Standard_Real): Standard_Boolean;
  static FindValidRange_2(theEdge: TopoDS_Edge, theFirst: Standard_Real, theLast: Standard_Real): Standard_Boolean;
  static ExtendFace(theF: TopoDS_Face, theExtVal: Standard_Real, theExtUMin: Standard_Boolean, theExtUMax: Standard_Boolean, theExtVMin: Standard_Boolean, theExtVMax: Standard_Boolean, theFExtended: TopoDS_Face): void;
  delete(): void;
}

export declare class TopExp_Explorer {
  Init(S: TopoDS_Shape, ToFind: TopAbs_ShapeEnum, ToAvoid: TopAbs_ShapeEnum): void;
  More(): Standard_Boolean;
  Next(): void;
  Value(): TopoDS_Shape;
  Current(): TopoDS_Shape;
  ReInit(): void;
  ExploredShape(): TopoDS_Shape;
  Depth(): Graphic3d_ZLayerId;
  Clear(): void;
  delete(): void;
}

  export declare class TopExp_Explorer_1 extends TopExp_Explorer {
    constructor();
  }

  export declare class TopExp_Explorer_2 extends TopExp_Explorer {
    constructor(S: TopoDS_Shape, ToFind: TopAbs_ShapeEnum, ToAvoid: TopAbs_ShapeEnum);
  }

export declare class StlAPI_Writer {
  constructor()
  ASCIIMode(): Standard_Boolean;
  Write(theShape: TopoDS_Shape, theFileName: Standard_CString, theProgress: Message_ProgressRange): Standard_Boolean;
  delete(): void;
}

export declare type BRepFill_TypeOfContact = {
  BRepFill_NoContact: {};
  BRepFill_Contact: {};
  BRepFill_ContactOnBorder: {};
}

export declare class BRepCheck_Analyzer {
  constructor(S: TopoDS_Shape, GeomControls: Standard_Boolean, theIsParallel: Standard_Boolean)
  Init(S: TopoDS_Shape, GeomControls: Standard_Boolean, theIsParallel: Standard_Boolean): void;
  IsValid_1(S: TopoDS_Shape): Standard_Boolean;
  IsValid_2(): Standard_Boolean;
  Result(theSubS: TopoDS_Shape): Handle_BRepCheck_Result;
  delete(): void;
}

export declare class BRepTools_ReShape extends Standard_Transient {
  constructor()
  Clear(): void;
  Remove(shape: TopoDS_Shape): void;
  Replace(shape: TopoDS_Shape, newshape: TopoDS_Shape): void;
  IsRecorded(shape: TopoDS_Shape): Standard_Boolean;
  Value(shape: TopoDS_Shape): TopoDS_Shape;
  Status(shape: TopoDS_Shape, newsh: TopoDS_Shape, last: Standard_Boolean): Graphic3d_ZLayerId;
  Apply(theShape: TopoDS_Shape, theUntil: TopAbs_ShapeEnum): TopoDS_Shape;
  ModeConsiderLocation(): Standard_Boolean;
  CopyVertex_1(theV: TopoDS_Vertex, theTol: Standard_Real): TopoDS_Vertex;
  CopyVertex_2(theV: TopoDS_Vertex, theNewPos: gp_Pnt, aTol: Standard_Real): TopoDS_Vertex;
  IsNewShape(theShape: TopoDS_Shape): Standard_Boolean;
  History(): Handle_BRepTools_History;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class BRepTools {
  constructor();
  static UVBounds_1(F: TopoDS_Face, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real): void;
  static UVBounds_2(F: TopoDS_Face, W: TopoDS_Wire, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real): void;
  static UVBounds_3(F: TopoDS_Face, E: TopoDS_Edge, UMin: Standard_Real, UMax: Standard_Real, VMin: Standard_Real, VMax: Standard_Real): void;
  static AddUVBounds_1(F: TopoDS_Face, B: Bnd_Box2d): void;
  static AddUVBounds_2(F: TopoDS_Face, W: TopoDS_Wire, B: Bnd_Box2d): void;
  static AddUVBounds_3(F: TopoDS_Face, E: TopoDS_Edge, B: Bnd_Box2d): void;
  static Update_1(V: TopoDS_Vertex): void;
  static Update_2(E: TopoDS_Edge): void;
  static Update_3(W: TopoDS_Wire): void;
  static Update_4(F: TopoDS_Face): void;
  static Update_5(S: TopoDS_Shell): void;
  static Update_6(S: TopoDS_Solid): void;
  static Update_7(C: TopoDS_CompSolid): void;
  static Update_8(C: TopoDS_Compound): void;
  static Update_9(S: TopoDS_Shape): void;
  static UpdateFaceUVPoints(theF: TopoDS_Face): void;
  static Clean(theShape: TopoDS_Shape, theForce: Standard_Boolean): void;
  static CleanGeometry(theShape: TopoDS_Shape): void;
  static RemoveUnusedPCurves(S: TopoDS_Shape): void;
  static Triangulation(theShape: TopoDS_Shape, theLinDefl: Standard_Real, theToCheckFreeEdges: Standard_Boolean): Standard_Boolean;
  static LoadTriangulation(theShape: TopoDS_Shape, theTriangulationIdx: Graphic3d_ZLayerId, theToSetAsActive: Standard_Boolean, theFileSystem: any): Standard_Boolean;
  static UnloadTriangulation(theShape: TopoDS_Shape, theTriangulationIdx: Graphic3d_ZLayerId): Standard_Boolean;
  static ActivateTriangulation(theShape: TopoDS_Shape, theTriangulationIdx: Graphic3d_ZLayerId, theToActivateStrictly: Standard_Boolean): Standard_Boolean;
  static LoadAllTriangulations(theShape: TopoDS_Shape, theFileSystem: any): Standard_Boolean;
  static UnloadAllTriangulations(theShape: TopoDS_Shape): Standard_Boolean;
  static Compare_1(V1: TopoDS_Vertex, V2: TopoDS_Vertex): Standard_Boolean;
  static Compare_2(E1: TopoDS_Edge, E2: TopoDS_Edge): Standard_Boolean;
  static OuterWire(F: TopoDS_Face): TopoDS_Wire;
  static Map3DEdges(S: TopoDS_Shape, M: TopTools_IndexedMapOfShape): void;
  static IsReallyClosed(E: TopoDS_Edge, F: TopoDS_Face): Standard_Boolean;
  static DetectClosedness(theFace: TopoDS_Face, theUclosed: Standard_Boolean, theVclosed: Standard_Boolean): void;
  static Dump(Sh: TopoDS_Shape, S: Standard_OStream): void;
  static Write_1(theShape: TopoDS_Shape, theStream: Standard_OStream, theProgress: Message_ProgressRange): void;
  static Write_2(theShape: TopoDS_Shape, theStream: Standard_OStream, theWithTriangles: Standard_Boolean, theWithNormals: Standard_Boolean, theVersion: TopTools_FormatVersion, theProgress: Message_ProgressRange): void;
  static Read_1(Sh: TopoDS_Shape, S: Standard_IStream, B: BRep_Builder, theProgress: Message_ProgressRange): void;
  static Write_3(theShape: TopoDS_Shape, theFile: Standard_CString, theProgress: Message_ProgressRange): Standard_Boolean;
  static Write_4(theShape: TopoDS_Shape, theFile: Standard_CString, theWithTriangles: Standard_Boolean, theWithNormals: Standard_Boolean, theVersion: TopTools_FormatVersion, theProgress: Message_ProgressRange): Standard_Boolean;
  static Read_2(Sh: TopoDS_Shape, File: Standard_CString, B: BRep_Builder, theProgress: Message_ProgressRange): Standard_Boolean;
  static EvalAndUpdateTol(theE: TopoDS_Edge, theC3d: Handle_Geom_Curve, theC2d: Handle_Geom2d_Curve, theS: Handle_Geom_Surface, theF: Standard_Real, theL: Standard_Real): Standard_Real;
  static OriEdgeInFace(theEdge: TopoDS_Edge, theFace: TopoDS_Face): TopAbs_Orientation;
  static RemoveInternals(theS: TopoDS_Shape, theForce: Standard_Boolean): void;
  static CheckLocations(theS: TopoDS_Shape, theProblemShapes: TopTools_ListOfShape): void;
  delete(): void;
}

export declare class Message_ProgressRange {
  UserBreak(): Standard_Boolean;
  More(): Standard_Boolean;
  IsActive(): Standard_Boolean;
  Close(): void;
  delete(): void;
}

  export declare class Message_ProgressRange_1 extends Message_ProgressRange {
    constructor();
  }

  export declare class Message_ProgressRange_2 extends Message_ProgressRange {
    constructor(theOther: Message_ProgressRange);
  }

export declare class Geom2dAPI_InterCurveCurve {
  Init_1(C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, Tol: Standard_Real): void;
  Init_2(C1: Handle_Geom2d_Curve, Tol: Standard_Real): void;
  NbPoints(): Graphic3d_ZLayerId;
  Point(Index: Graphic3d_ZLayerId): gp_Pnt2d;
  NbSegments(): Graphic3d_ZLayerId;
  Segment(Index: Graphic3d_ZLayerId, Curve1: Handle_Geom2d_Curve, Curve2: Handle_Geom2d_Curve): void;
  Intersector(): Geom2dInt_GInter;
  delete(): void;
}

  export declare class Geom2dAPI_InterCurveCurve_1 extends Geom2dAPI_InterCurveCurve {
    constructor();
  }

  export declare class Geom2dAPI_InterCurveCurve_2 extends Geom2dAPI_InterCurveCurve {
    constructor(C1: Handle_Geom2d_Curve, C2: Handle_Geom2d_Curve, Tol: Standard_Real);
  }

  export declare class Geom2dAPI_InterCurveCurve_3 extends Geom2dAPI_InterCurveCurve {
    constructor(C1: Handle_Geom2d_Curve, Tol: Standard_Real);
  }

export declare class GCE2d_MakeArcOfCircle extends GCE2d_Root {
  Value(): Handle_Geom2d_TrimmedCurve;
  delete(): void;
}

  export declare class GCE2d_MakeArcOfCircle_1 extends GCE2d_MakeArcOfCircle {
    constructor(Circ: gp_Circ2d, Alpha1: Standard_Real, Alpha2: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GCE2d_MakeArcOfCircle_2 extends GCE2d_MakeArcOfCircle {
    constructor(Circ: gp_Circ2d, P: gp_Pnt2d, Alpha: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GCE2d_MakeArcOfCircle_3 extends GCE2d_MakeArcOfCircle {
    constructor(Circ: gp_Circ2d, P1: gp_Pnt2d, P2: gp_Pnt2d, Sense: Standard_Boolean);
  }

  export declare class GCE2d_MakeArcOfCircle_4 extends GCE2d_MakeArcOfCircle {
    constructor(P1: gp_Pnt2d, P2: gp_Pnt2d, P3: gp_Pnt2d);
  }

  export declare class GCE2d_MakeArcOfCircle_5 extends GCE2d_MakeArcOfCircle {
    constructor(P1: gp_Pnt2d, V: gp_Vec2d, P2: gp_Pnt2d);
  }

export declare class GCE2d_Root {
  constructor();
  IsDone(): Standard_Boolean;
  Status(): gce_ErrorType;
  delete(): void;
}

export declare class GCE2d_MakeArcOfEllipse extends GCE2d_Root {
  Value(): Handle_Geom2d_TrimmedCurve;
  delete(): void;
}

  export declare class GCE2d_MakeArcOfEllipse_1 extends GCE2d_MakeArcOfEllipse {
    constructor(Elips: gp_Elips2d, Alpha1: Standard_Real, Alpha2: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GCE2d_MakeArcOfEllipse_2 extends GCE2d_MakeArcOfEllipse {
    constructor(Elips: gp_Elips2d, P: gp_Pnt2d, Alpha: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class GCE2d_MakeArcOfEllipse_3 extends GCE2d_MakeArcOfEllipse {
    constructor(Elips: gp_Elips2d, P1: gp_Pnt2d, P2: gp_Pnt2d, Sense: Standard_Boolean);
  }

export declare class GCE2d_MakeSegment extends GCE2d_Root {
  Value(): Handle_Geom2d_TrimmedCurve;
  delete(): void;
}

  export declare class GCE2d_MakeSegment_1 extends GCE2d_MakeSegment {
    constructor(P1: gp_Pnt2d, P2: gp_Pnt2d);
  }

  export declare class GCE2d_MakeSegment_2 extends GCE2d_MakeSegment {
    constructor(P1: gp_Pnt2d, V: gp_Dir2d, P2: gp_Pnt2d);
  }

  export declare class GCE2d_MakeSegment_3 extends GCE2d_MakeSegment {
    constructor(Line: gp_Lin2d, U1: Standard_Real, U2: Standard_Real);
  }

  export declare class GCE2d_MakeSegment_4 extends GCE2d_MakeSegment {
    constructor(Line: gp_Lin2d, Point: gp_Pnt2d, Ulast: Standard_Real);
  }

  export declare class GCE2d_MakeSegment_5 extends GCE2d_MakeSegment {
    constructor(Line: gp_Lin2d, P1: gp_Pnt2d, P2: gp_Pnt2d);
  }

export declare class Precision {
  constructor();
  static Angular(): Standard_Real;
  static Confusion(): Standard_Real;
  static SquareConfusion(): Standard_Real;
  static Intersection(): Standard_Real;
  static Approximation(): Standard_Real;
  static Parametric_1(P: Standard_Real, T: Standard_Real): Standard_Real;
  static PConfusion_1(T: Standard_Real): Standard_Real;
  static SquarePConfusion(): Standard_Real;
  static PIntersection_1(T: Standard_Real): Standard_Real;
  static PApproximation_1(T: Standard_Real): Standard_Real;
  static Parametric_2(P: Standard_Real): Standard_Real;
  static PConfusion_2(): Standard_Real;
  static PIntersection_2(): Standard_Real;
  static PApproximation_2(): Standard_Real;
  static IsInfinite(R: Standard_Real): Standard_Boolean;
  static IsPositiveInfinite(R: Standard_Real): Standard_Boolean;
  static IsNegativeInfinite(R: Standard_Real): Standard_Boolean;
  static Infinite(): Standard_Real;
  delete(): void;
}

export declare type IFSelect_ReturnStatus = {
  IFSelect_RetVoid: {};
  IFSelect_RetDone: {};
  IFSelect_RetError: {};
  IFSelect_RetFail: {};
  IFSelect_RetStop: {};
}

export declare class GProp_GProps {
  Add(Item: GProp_GProps, Density: Standard_Real): void;
  Mass(): Standard_Real;
  CentreOfMass(): gp_Pnt;
  MatrixOfInertia(): gp_Mat;
  StaticMoments(Ix: Standard_Real, Iy: Standard_Real, Iz: Standard_Real): void;
  MomentOfInertia(A: gp_Ax1): Standard_Real;
  PrincipalProperties(): GProp_PrincipalProps;
  RadiusOfGyration(A: gp_Ax1): Standard_Real;
  delete(): void;
}

  export declare class GProp_GProps_1 extends GProp_GProps {
    constructor();
  }

  export declare class GProp_GProps_2 extends GProp_GProps {
    constructor(SystemLocation: gp_Pnt);
  }

export declare class Handle_Geom2d_BoundedCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_BoundedCurve): void;
  get(): Geom2d_BoundedCurve;
  delete(): void;
}

  export declare class Handle_Geom2d_BoundedCurve_1 extends Handle_Geom2d_BoundedCurve {
    constructor();
  }

  export declare class Handle_Geom2d_BoundedCurve_2 extends Handle_Geom2d_BoundedCurve {
    constructor(thePtr: Geom2d_BoundedCurve);
  }

  export declare class Handle_Geom2d_BoundedCurve_3 extends Handle_Geom2d_BoundedCurve {
    constructor(theHandle: Handle_Geom2d_BoundedCurve);
  }

  export declare class Handle_Geom2d_BoundedCurve_4 extends Handle_Geom2d_BoundedCurve {
    constructor(theHandle: Handle_Geom2d_BoundedCurve);
  }

export declare class Geom2d_BoundedCurve extends Geom2d_Curve {
  EndPoint(): gp_Pnt2d;
  StartPoint(): gp_Pnt2d;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom2d_Geometry extends Standard_Transient {
  Mirror_1(P: gp_Pnt2d): void;
  Mirror_2(A: gp_Ax2d): void;
  Rotate(P: gp_Pnt2d, Ang: Standard_Real): void;
  Scale(P: gp_Pnt2d, S: Standard_Real): void;
  Translate_1(V: gp_Vec2d): void;
  Translate_2(P1: gp_Pnt2d, P2: gp_Pnt2d): void;
  Transform(T: gp_Trsf2d): void;
  Mirrored_1(P: gp_Pnt2d): Handle_Geom2d_Geometry;
  Mirrored_2(A: gp_Ax2d): Handle_Geom2d_Geometry;
  Rotated(P: gp_Pnt2d, Ang: Standard_Real): Handle_Geom2d_Geometry;
  Scaled(P: gp_Pnt2d, S: Standard_Real): Handle_Geom2d_Geometry;
  Transformed(T: gp_Trsf2d): Handle_Geom2d_Geometry;
  Translated_1(V: gp_Vec2d): Handle_Geom2d_Geometry;
  Translated_2(P1: gp_Pnt2d, P2: gp_Pnt2d): Handle_Geom2d_Geometry;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Handle_Geom2d_Geometry {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_Geometry): void;
  get(): Geom2d_Geometry;
  delete(): void;
}

  export declare class Handle_Geom2d_Geometry_1 extends Handle_Geom2d_Geometry {
    constructor();
  }

  export declare class Handle_Geom2d_Geometry_2 extends Handle_Geom2d_Geometry {
    constructor(thePtr: Geom2d_Geometry);
  }

  export declare class Handle_Geom2d_Geometry_3 extends Handle_Geom2d_Geometry {
    constructor(theHandle: Handle_Geom2d_Geometry);
  }

  export declare class Handle_Geom2d_Geometry_4 extends Handle_Geom2d_Geometry {
    constructor(theHandle: Handle_Geom2d_Geometry);
  }

export declare class Handle_Geom2d_Line {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_Line): void;
  get(): Geom2d_Line;
  delete(): void;
}

  export declare class Handle_Geom2d_Line_1 extends Handle_Geom2d_Line {
    constructor();
  }

  export declare class Handle_Geom2d_Line_2 extends Handle_Geom2d_Line {
    constructor(thePtr: Geom2d_Line);
  }

  export declare class Handle_Geom2d_Line_3 extends Handle_Geom2d_Line {
    constructor(theHandle: Handle_Geom2d_Line);
  }

  export declare class Handle_Geom2d_Line_4 extends Handle_Geom2d_Line {
    constructor(theHandle: Handle_Geom2d_Line);
  }

export declare class Geom2d_Line extends Geom2d_Curve {
  SetLin2d(L: gp_Lin2d): void;
  SetDirection(V: gp_Dir2d): void;
  Direction(): gp_Dir2d;
  SetLocation(P: gp_Pnt2d): void;
  Location(): gp_Pnt2d;
  SetPosition(A: gp_Ax2d): void;
  Position(): gp_Ax2d;
  Lin2d(): gp_Lin2d;
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Continuity(): GeomAbs_Shape;
  Distance(P: gp_Pnt2d): Standard_Real;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  Transform(T: gp_Trsf2d): void;
  TransformedParameter(U: Standard_Real, T: gp_Trsf2d): Standard_Real;
  ParametricTransformation(T: gp_Trsf2d): Standard_Real;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom2d_Line_1 extends Geom2d_Line {
    constructor(A: gp_Ax2d);
  }

  export declare class Geom2d_Line_2 extends Geom2d_Line {
    constructor(L: gp_Lin2d);
  }

  export declare class Geom2d_Line_3 extends Geom2d_Line {
    constructor(P: gp_Pnt2d, V: gp_Dir2d);
  }

export declare class Geom2d_TrimmedCurve extends Geom2d_BoundedCurve {
  constructor(C: Handle_Geom2d_Curve, U1: Standard_Real, U2: Standard_Real, Sense: Standard_Boolean, theAdjustPeriodic: Standard_Boolean)
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  SetTrim(U1: Standard_Real, U2: Standard_Real, Sense: Standard_Boolean, theAdjustPeriodic: Standard_Boolean): void;
  BasisCurve(): Handle_Geom2d_Curve;
  Continuity(): GeomAbs_Shape;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  EndPoint(): gp_Pnt2d;
  FirstParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  LastParameter(): Standard_Real;
  StartPoint(): gp_Pnt2d;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  Transform(T: gp_Trsf2d): void;
  TransformedParameter(U: Standard_Real, T: gp_Trsf2d): Standard_Real;
  ParametricTransformation(T: gp_Trsf2d): Standard_Real;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Handle_Geom2d_TrimmedCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_TrimmedCurve): void;
  get(): Geom2d_TrimmedCurve;
  delete(): void;
}

  export declare class Handle_Geom2d_TrimmedCurve_1 extends Handle_Geom2d_TrimmedCurve {
    constructor();
  }

  export declare class Handle_Geom2d_TrimmedCurve_2 extends Handle_Geom2d_TrimmedCurve {
    constructor(thePtr: Geom2d_TrimmedCurve);
  }

  export declare class Handle_Geom2d_TrimmedCurve_3 extends Handle_Geom2d_TrimmedCurve {
    constructor(theHandle: Handle_Geom2d_TrimmedCurve);
  }

  export declare class Handle_Geom2d_TrimmedCurve_4 extends Handle_Geom2d_TrimmedCurve {
    constructor(theHandle: Handle_Geom2d_TrimmedCurve);
  }

export declare class Geom2d_BezierCurve extends Geom2d_BoundedCurve {
  Increase(Degree: Graphic3d_ZLayerId): void;
  InsertPoleAfter(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  InsertPoleBefore(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  RemovePole(Index: Graphic3d_ZLayerId): void;
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Segment(U1: Standard_Real, U2: Standard_Real): void;
  SetPole_1(Index: Graphic3d_ZLayerId, P: gp_Pnt2d): void;
  SetPole_2(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  SetWeight(Index: Graphic3d_ZLayerId, Weight: Standard_Real): void;
  IsClosed(): Standard_Boolean;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  IsRational(): Standard_Boolean;
  Continuity(): GeomAbs_Shape;
  Degree(): Graphic3d_ZLayerId;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  EndPoint(): gp_Pnt2d;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  NbPoles(): Graphic3d_ZLayerId;
  Pole(Index: Graphic3d_ZLayerId): gp_Pnt2d;
  Poles_1(P: TColgp_Array1OfPnt2d): void;
  Poles_2(): TColgp_Array1OfPnt2d;
  StartPoint(): gp_Pnt2d;
  Weight(Index: Graphic3d_ZLayerId): Standard_Real;
  Weights_1(W: IntTools_CArray1OfReal): void;
  Weights_2(): IntTools_CArray1OfReal;
  Transform(T: gp_Trsf2d): void;
  static MaxDegree(): Graphic3d_ZLayerId;
  Resolution(ToleranceUV: Standard_Real, UTolerance: Standard_Real): void;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom2d_BezierCurve_1 extends Geom2d_BezierCurve {
    constructor(CurvePoles: TColgp_Array1OfPnt2d);
  }

  export declare class Geom2d_BezierCurve_2 extends Geom2d_BezierCurve {
    constructor(CurvePoles: TColgp_Array1OfPnt2d, PoleWeights: IntTools_CArray1OfReal);
  }

export declare class Handle_Geom2d_BezierCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_BezierCurve): void;
  get(): Geom2d_BezierCurve;
  delete(): void;
}

  export declare class Handle_Geom2d_BezierCurve_1 extends Handle_Geom2d_BezierCurve {
    constructor();
  }

  export declare class Handle_Geom2d_BezierCurve_2 extends Handle_Geom2d_BezierCurve {
    constructor(thePtr: Geom2d_BezierCurve);
  }

  export declare class Handle_Geom2d_BezierCurve_3 extends Handle_Geom2d_BezierCurve {
    constructor(theHandle: Handle_Geom2d_BezierCurve);
  }

  export declare class Handle_Geom2d_BezierCurve_4 extends Handle_Geom2d_BezierCurve {
    constructor(theHandle: Handle_Geom2d_BezierCurve);
  }

export declare class Handle_Geom2d_BSplineCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_BSplineCurve): void;
  get(): Geom2d_BSplineCurve;
  delete(): void;
}

  export declare class Handle_Geom2d_BSplineCurve_1 extends Handle_Geom2d_BSplineCurve {
    constructor();
  }

  export declare class Handle_Geom2d_BSplineCurve_2 extends Handle_Geom2d_BSplineCurve {
    constructor(thePtr: Geom2d_BSplineCurve);
  }

  export declare class Handle_Geom2d_BSplineCurve_3 extends Handle_Geom2d_BSplineCurve {
    constructor(theHandle: Handle_Geom2d_BSplineCurve);
  }

  export declare class Handle_Geom2d_BSplineCurve_4 extends Handle_Geom2d_BSplineCurve {
    constructor(theHandle: Handle_Geom2d_BSplineCurve);
  }

export declare class Geom2d_BSplineCurve extends Geom2d_BoundedCurve {
  IncreaseDegree(Degree: Graphic3d_ZLayerId): void;
  IncreaseMultiplicity_1(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncreaseMultiplicity_2(I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncrementMultiplicity(I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  InsertKnot(U: Standard_Real, M: Graphic3d_ZLayerId, ParametricTolerance: Standard_Real): void;
  InsertKnots(Knots: IntTools_CArray1OfReal, Mults: TColStd_Array1OfInteger, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  RemoveKnot(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId, Tolerance: Standard_Real): Standard_Boolean;
  InsertPoleAfter(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  InsertPoleBefore(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  RemovePole(Index: Graphic3d_ZLayerId): void;
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Segment(U1: Standard_Real, U2: Standard_Real, theTolerance: Standard_Real): void;
  SetKnot_1(Index: Graphic3d_ZLayerId, K: Standard_Real): void;
  SetKnots(K: IntTools_CArray1OfReal): void;
  SetKnot_2(Index: Graphic3d_ZLayerId, K: Standard_Real, M: Graphic3d_ZLayerId): void;
  PeriodicNormalization(U: Standard_Real): void;
  SetPeriodic(): void;
  SetOrigin(Index: Graphic3d_ZLayerId): void;
  SetNotPeriodic(): void;
  SetPole_1(Index: Graphic3d_ZLayerId, P: gp_Pnt2d): void;
  SetPole_2(Index: Graphic3d_ZLayerId, P: gp_Pnt2d, Weight: Standard_Real): void;
  SetWeight(Index: Graphic3d_ZLayerId, Weight: Standard_Real): void;
  MovePoint(U: Standard_Real, P: gp_Pnt2d, Index1: Graphic3d_ZLayerId, Index2: Graphic3d_ZLayerId, FirstModifiedPole: Graphic3d_ZLayerId, LastModifiedPole: Graphic3d_ZLayerId): void;
  MovePointAndTangent(U: Standard_Real, P: gp_Pnt2d, Tangent: gp_Vec2d, Tolerance: Standard_Real, StartingCondition: Graphic3d_ZLayerId, EndingCondition: Graphic3d_ZLayerId, ErrorStatus: Graphic3d_ZLayerId): void;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsG1(theTf: Standard_Real, theTl: Standard_Real, theAngTol: Standard_Real): Standard_Boolean;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  IsRational(): Standard_Boolean;
  Continuity(): GeomAbs_Shape;
  Degree(): Graphic3d_ZLayerId;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  LocalValue(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId): gp_Pnt2d;
  LocalD0(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt2d): void;
  LocalD1(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt2d, V1: gp_Vec2d): void;
  LocalD2(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  LocalD3(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  LocalDN(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, N: Graphic3d_ZLayerId): gp_Vec2d;
  EndPoint(): gp_Pnt2d;
  FirstUKnotIndex(): Graphic3d_ZLayerId;
  FirstParameter(): Standard_Real;
  Knot(Index: Graphic3d_ZLayerId): Standard_Real;
  Knots_1(K: IntTools_CArray1OfReal): void;
  Knots_2(): IntTools_CArray1OfReal;
  KnotSequence_1(K: IntTools_CArray1OfReal): void;
  KnotSequence_2(): IntTools_CArray1OfReal;
  KnotDistribution(): GeomAbs_BSplKnotDistribution;
  LastUKnotIndex(): Graphic3d_ZLayerId;
  LastParameter(): Standard_Real;
  LocateU(U: Standard_Real, ParametricTolerance: Standard_Real, I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, WithKnotRepetition: Standard_Boolean): void;
  Multiplicity(Index: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Multiplicities_1(M: TColStd_Array1OfInteger): void;
  Multiplicities_2(): TColStd_Array1OfInteger;
  NbKnots(): Graphic3d_ZLayerId;
  NbPoles(): Graphic3d_ZLayerId;
  Pole(Index: Graphic3d_ZLayerId): gp_Pnt2d;
  Poles_1(P: TColgp_Array1OfPnt2d): void;
  Poles_2(): TColgp_Array1OfPnt2d;
  StartPoint(): gp_Pnt2d;
  Weight(Index: Graphic3d_ZLayerId): Standard_Real;
  Weights_1(W: IntTools_CArray1OfReal): void;
  Weights_2(): IntTools_CArray1OfReal;
  Transform(T: gp_Trsf2d): void;
  static MaxDegree(): Graphic3d_ZLayerId;
  Resolution(ToleranceUV: Standard_Real, UTolerance: Standard_Real): void;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom2d_BSplineCurve_1 extends Geom2d_BSplineCurve {
    constructor(Poles: TColgp_Array1OfPnt2d, Knots: IntTools_CArray1OfReal, Multiplicities: TColStd_Array1OfInteger, Degree: Graphic3d_ZLayerId, Periodic: Standard_Boolean);
  }

  export declare class Geom2d_BSplineCurve_2 extends Geom2d_BSplineCurve {
    constructor(Poles: TColgp_Array1OfPnt2d, Weights: IntTools_CArray1OfReal, Knots: IntTools_CArray1OfReal, Multiplicities: TColStd_Array1OfInteger, Degree: Graphic3d_ZLayerId, Periodic: Standard_Boolean);
  }

export declare class Handle_Geom2d_Curve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_Curve): void;
  get(): Geom2d_Curve;
  delete(): void;
}

  export declare class Handle_Geom2d_Curve_1 extends Handle_Geom2d_Curve {
    constructor();
  }

  export declare class Handle_Geom2d_Curve_2 extends Handle_Geom2d_Curve {
    constructor(thePtr: Geom2d_Curve);
  }

  export declare class Handle_Geom2d_Curve_3 extends Handle_Geom2d_Curve {
    constructor(theHandle: Handle_Geom2d_Curve);
  }

  export declare class Handle_Geom2d_Curve_4 extends Handle_Geom2d_Curve {
    constructor(theHandle: Handle_Geom2d_Curve);
  }

export declare class Geom2d_Curve extends Geom2d_Geometry {
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  TransformedParameter(U: Standard_Real, T: gp_Trsf2d): Standard_Real;
  ParametricTransformation(T: gp_Trsf2d): Standard_Real;
  Reversed(): Handle_Geom2d_Curve;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  Continuity(): GeomAbs_Shape;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  Value(U: Standard_Real): gp_Pnt2d;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom2d_Circle extends Geom2d_Conic {
  SetCirc2d(C: gp_Circ2d): void;
  SetRadius(R: Standard_Real): void;
  Circ2d(): gp_Circ2d;
  Radius(): Standard_Real;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Eccentricity(): Standard_Real;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  Transform(T: gp_Trsf2d): void;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom2d_Circle_1 extends Geom2d_Circle {
    constructor(C: gp_Circ2d);
  }

  export declare class Geom2d_Circle_2 extends Geom2d_Circle {
    constructor(A: gp_Ax2d, Radius: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class Geom2d_Circle_3 extends Geom2d_Circle {
    constructor(A: gp_Ax22d, Radius: Standard_Real);
  }

export declare class Handle_Geom2d_Circle {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_Circle): void;
  get(): Geom2d_Circle;
  delete(): void;
}

  export declare class Handle_Geom2d_Circle_1 extends Handle_Geom2d_Circle {
    constructor();
  }

  export declare class Handle_Geom2d_Circle_2 extends Handle_Geom2d_Circle {
    constructor(thePtr: Geom2d_Circle);
  }

  export declare class Handle_Geom2d_Circle_3 extends Handle_Geom2d_Circle {
    constructor(theHandle: Handle_Geom2d_Circle);
  }

  export declare class Handle_Geom2d_Circle_4 extends Handle_Geom2d_Circle {
    constructor(theHandle: Handle_Geom2d_Circle);
  }

export declare class Handle_Geom2d_Ellipse {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom2d_Ellipse): void;
  get(): Geom2d_Ellipse;
  delete(): void;
}

  export declare class Handle_Geom2d_Ellipse_1 extends Handle_Geom2d_Ellipse {
    constructor();
  }

  export declare class Handle_Geom2d_Ellipse_2 extends Handle_Geom2d_Ellipse {
    constructor(thePtr: Geom2d_Ellipse);
  }

  export declare class Handle_Geom2d_Ellipse_3 extends Handle_Geom2d_Ellipse {
    constructor(theHandle: Handle_Geom2d_Ellipse);
  }

  export declare class Handle_Geom2d_Ellipse_4 extends Handle_Geom2d_Ellipse {
    constructor(theHandle: Handle_Geom2d_Ellipse);
  }

export declare class Geom2d_Ellipse extends Geom2d_Conic {
  SetElips2d(E: gp_Elips2d): void;
  SetMajorRadius(MajorRadius: Standard_Real): void;
  SetMinorRadius(MinorRadius: Standard_Real): void;
  Elips2d(): gp_Elips2d;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Directrix1(): gp_Ax2d;
  Directrix2(): gp_Ax2d;
  Eccentricity(): Standard_Real;
  Focal(): Standard_Real;
  Focus1(): gp_Pnt2d;
  Focus2(): gp_Pnt2d;
  MajorRadius(): Standard_Real;
  MinorRadius(): Standard_Real;
  Parameter(): Standard_Real;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  D0(U: Standard_Real, P: gp_Pnt2d): void;
  D1(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  D2(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d): void;
  D3(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d, V2: gp_Vec2d, V3: gp_Vec2d): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec2d;
  Transform(T: gp_Trsf2d): void;
  Copy(): Handle_Geom2d_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom2d_Ellipse_1 extends Geom2d_Ellipse {
    constructor(E: gp_Elips2d);
  }

  export declare class Geom2d_Ellipse_2 extends Geom2d_Ellipse {
    constructor(MajorAxis: gp_Ax2d, MajorRadius: Standard_Real, MinorRadius: Standard_Real, Sense: Standard_Boolean);
  }

  export declare class Geom2d_Ellipse_3 extends Geom2d_Ellipse {
    constructor(Axis: gp_Ax22d, MajorRadius: Standard_Real, MinorRadius: Standard_Real);
  }

export declare type Extrema_ExtAlgo = {
  Extrema_ExtAlgo_Grad: {};
  Extrema_ExtAlgo_Tree: {};
}

export declare class TColgp_Array1OfDir {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: gp_Dir): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColgp_Array1OfDir): TColgp_Array1OfDir;
  Move(theOther: TColgp_Array1OfDir): TColgp_Array1OfDir;
  First(): gp_Dir;
  ChangeFirst(): gp_Dir;
  Last(): gp_Dir;
  ChangeLast(): gp_Dir;
  Value(theIndex: Standard_Integer): gp_Dir;
  ChangeValue(theIndex: Standard_Integer): gp_Dir;
  SetValue(theIndex: Standard_Integer, theItem: gp_Dir): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColgp_Array1OfDir_1 extends TColgp_Array1OfDir {
    constructor();
  }

  export declare class TColgp_Array1OfDir_2 extends TColgp_Array1OfDir {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColgp_Array1OfDir_3 extends TColgp_Array1OfDir {
    constructor(theOther: TColgp_Array1OfDir);
  }

  export declare class TColgp_Array1OfDir_4 extends TColgp_Array1OfDir {
    constructor(theOther: TColgp_Array1OfDir);
  }

  export declare class TColgp_Array1OfDir_5 extends TColgp_Array1OfDir {
    constructor(theBegin: gp_Dir, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class Handle_TColgp_HArray1OfPnt {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: TColgp_HArray1OfPnt): void;
  get(): TColgp_HArray1OfPnt;
  delete(): void;
}

  export declare class Handle_TColgp_HArray1OfPnt_1 extends Handle_TColgp_HArray1OfPnt {
    constructor();
  }

  export declare class Handle_TColgp_HArray1OfPnt_2 extends Handle_TColgp_HArray1OfPnt {
    constructor(thePtr: TColgp_HArray1OfPnt);
  }

  export declare class Handle_TColgp_HArray1OfPnt_3 extends Handle_TColgp_HArray1OfPnt {
    constructor(theHandle: Handle_TColgp_HArray1OfPnt);
  }

  export declare class Handle_TColgp_HArray1OfPnt_4 extends Handle_TColgp_HArray1OfPnt {
    constructor(theHandle: Handle_TColgp_HArray1OfPnt);
  }

export declare class TColgp_Array1OfPnt {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: gp_Pnt): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColgp_Array1OfPnt): TColgp_Array1OfPnt;
  Move(theOther: TColgp_Array1OfPnt): TColgp_Array1OfPnt;
  First(): gp_Pnt;
  ChangeFirst(): gp_Pnt;
  Last(): gp_Pnt;
  ChangeLast(): gp_Pnt;
  Value(theIndex: Standard_Integer): gp_Pnt;
  ChangeValue(theIndex: Standard_Integer): gp_Pnt;
  SetValue(theIndex: Standard_Integer, theItem: gp_Pnt): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColgp_Array1OfPnt_1 extends TColgp_Array1OfPnt {
    constructor();
  }

  export declare class TColgp_Array1OfPnt_2 extends TColgp_Array1OfPnt {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColgp_Array1OfPnt_3 extends TColgp_Array1OfPnt {
    constructor(theOther: TColgp_Array1OfPnt);
  }

  export declare class TColgp_Array1OfPnt_4 extends TColgp_Array1OfPnt {
    constructor(theOther: TColgp_Array1OfPnt);
  }

  export declare class TColgp_Array1OfPnt_5 extends TColgp_Array1OfPnt {
    constructor(theBegin: gp_Pnt, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class TColgp_Array1OfVec {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: gp_Vec): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColgp_Array1OfVec): TColgp_Array1OfVec;
  Move(theOther: TColgp_Array1OfVec): TColgp_Array1OfVec;
  First(): gp_Vec;
  ChangeFirst(): gp_Vec;
  Last(): gp_Vec;
  ChangeLast(): gp_Vec;
  Value(theIndex: Standard_Integer): gp_Vec;
  ChangeValue(theIndex: Standard_Integer): gp_Vec;
  SetValue(theIndex: Standard_Integer, theItem: gp_Vec): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColgp_Array1OfVec_1 extends TColgp_Array1OfVec {
    constructor();
  }

  export declare class TColgp_Array1OfVec_2 extends TColgp_Array1OfVec {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColgp_Array1OfVec_3 extends TColgp_Array1OfVec {
    constructor(theOther: TColgp_Array1OfVec);
  }

  export declare class TColgp_Array1OfVec_4 extends TColgp_Array1OfVec {
    constructor(theOther: TColgp_Array1OfVec);
  }

  export declare class TColgp_Array1OfVec_5 extends TColgp_Array1OfVec {
    constructor(theBegin: gp_Vec, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class TColgp_Array2OfPnt {
  Init(theValue: gp_Pnt): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  NbRows(): Standard_Integer;
  NbColumns(): Standard_Integer;
  RowLength(): Standard_Integer;
  ColLength(): Standard_Integer;
  LowerRow(): Standard_Integer;
  UpperRow(): Standard_Integer;
  LowerCol(): Standard_Integer;
  UpperCol(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  Assign(theOther: TColgp_Array2OfPnt): TColgp_Array2OfPnt;
  Move(theOther: TColgp_Array2OfPnt): TColgp_Array2OfPnt;
  Value(theRow: Standard_Integer, theCol: Standard_Integer): gp_Pnt;
  ChangeValue(theRow: Standard_Integer, theCol: Standard_Integer): gp_Pnt;
  SetValue(theRow: Standard_Integer, theCol: Standard_Integer, theItem: gp_Pnt): void;
  Resize(theRowLower: Standard_Integer, theRowUpper: Standard_Integer, theColLower: Standard_Integer, theColUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColgp_Array2OfPnt_1 extends TColgp_Array2OfPnt {
    constructor();
  }

  export declare class TColgp_Array2OfPnt_2 extends TColgp_Array2OfPnt {
    constructor(theRowLower: Standard_Integer, theRowUpper: Standard_Integer, theColLower: Standard_Integer, theColUpper: Standard_Integer);
  }

  export declare class TColgp_Array2OfPnt_3 extends TColgp_Array2OfPnt {
    constructor(theOther: TColgp_Array2OfPnt);
  }

  export declare class TColgp_Array2OfPnt_4 extends TColgp_Array2OfPnt {
    constructor(theOther: TColgp_Array2OfPnt);
  }

  export declare class TColgp_Array2OfPnt_5 extends TColgp_Array2OfPnt {
    constructor(theBegin: gp_Pnt, theRowLower: Standard_Integer, theRowUpper: Standard_Integer, theColLower: Standard_Integer, theColUpper: Standard_Integer);
  }

export declare class TColgp_Array1OfPnt2d {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: gp_Pnt2d): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColgp_Array1OfPnt2d): TColgp_Array1OfPnt2d;
  Move(theOther: TColgp_Array1OfPnt2d): TColgp_Array1OfPnt2d;
  First(): gp_Pnt2d;
  ChangeFirst(): gp_Pnt2d;
  Last(): gp_Pnt2d;
  ChangeLast(): gp_Pnt2d;
  Value(theIndex: Standard_Integer): gp_Pnt2d;
  ChangeValue(theIndex: Standard_Integer): gp_Pnt2d;
  SetValue(theIndex: Standard_Integer, theItem: gp_Pnt2d): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColgp_Array1OfPnt2d_1 extends TColgp_Array1OfPnt2d {
    constructor();
  }

  export declare class TColgp_Array1OfPnt2d_2 extends TColgp_Array1OfPnt2d {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColgp_Array1OfPnt2d_3 extends TColgp_Array1OfPnt2d {
    constructor(theOther: TColgp_Array1OfPnt2d);
  }

  export declare class TColgp_Array1OfPnt2d_4 extends TColgp_Array1OfPnt2d {
    constructor(theOther: TColgp_Array1OfPnt2d);
  }

  export declare class TColgp_Array1OfPnt2d_5 extends TColgp_Array1OfPnt2d {
    constructor(theBegin: gp_Pnt2d, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class GeomLib {
  constructor();
  static To3d(Position: gp_Ax2, Curve2d: Handle_Geom2d_Curve): Handle_Geom_Curve;
  static GTransform(Curve: Handle_Geom2d_Curve, GTrsf: gp_GTrsf2d): Handle_Geom2d_Curve;
  static SameRange(Tolerance: Standard_Real, Curve2dPtr: Handle_Geom2d_Curve, First: Standard_Real, Last: Standard_Real, RequestedFirst: Standard_Real, RequestedLast: Standard_Real, NewCurve2dPtr: Handle_Geom2d_Curve): void;
  static BuildCurve3d(Tolerance: Standard_Real, CurvePtr: Adaptor3d_CurveOnSurface, FirstParameter: Standard_Real, LastParameter: Standard_Real, NewCurvePtr: Handle_Geom_Curve, MaxDeviation: Standard_Real, AverageDeviation: Standard_Real, Continuity: GeomAbs_Shape, MaxDegree: Graphic3d_ZLayerId, MaxSegment: Graphic3d_ZLayerId): void;
  static AdjustExtremity(Curve: Handle_Geom_BoundedCurve, P1: gp_Pnt, P2: gp_Pnt, T1: gp_Vec, T2: gp_Vec): void;
  static ExtendCurveToPoint(Curve: Handle_Geom_BoundedCurve, Point: gp_Pnt, Cont: Graphic3d_ZLayerId, After: Standard_Boolean): void;
  static ExtendSurfByLength(Surf: Handle_Geom_BoundedSurface, Length: Standard_Real, Cont: Graphic3d_ZLayerId, InU: Standard_Boolean, After: Standard_Boolean): void;
  static AxeOfInertia(Points: TColgp_Array1OfPnt, Axe: gp_Ax2, IsSingular: Standard_Boolean, Tol: Standard_Real): void;
  static Inertia(Points: TColgp_Array1OfPnt, Bary: gp_Pnt, XDir: gp_Dir, YDir: gp_Dir, Xgap: Standard_Real, YGap: Standard_Real, ZGap: Standard_Real): void;
  static RemovePointsFromArray(NumPoints: Graphic3d_ZLayerId, InParameters: IntTools_CArray1OfReal, OutParameters: Handle_TColStd_HArray1OfReal): void;
  static DensifyArray1OfReal(MinNumPoints: Graphic3d_ZLayerId, InParameters: IntTools_CArray1OfReal, OutParameters: Handle_TColStd_HArray1OfReal): void;
  static FuseIntervals(Interval1: IntTools_CArray1OfReal, Interval2: IntTools_CArray1OfReal, Fusion: TColStd_SequenceOfReal, Confusion: Standard_Real, IsAdjustToFirstInterval: Standard_Boolean): void;
  static EvalMaxParametricDistance(Curve: Adaptor3d_Curve, AReferenceCurve: Adaptor3d_Curve, Tolerance: Standard_Real, Parameters: IntTools_CArray1OfReal, MaxDistance: Standard_Real): void;
  static EvalMaxDistanceAlongParameter(Curve: Adaptor3d_Curve, AReferenceCurve: Adaptor3d_Curve, Tolerance: Standard_Real, Parameters: IntTools_CArray1OfReal, MaxDistance: Standard_Real): void;
  static CancelDenominatorDerivative(BSurf: Handle_Geom_BSplineSurface, UDirection: Standard_Boolean, VDirection: Standard_Boolean): void;
  static NormEstim(S: Handle_Geom_Surface, UV: gp_Pnt2d, Tol: Standard_Real, N: gp_Dir): Graphic3d_ZLayerId;
  static IsClosed(S: Handle_Geom_Surface, Tol: Standard_Real, isUClosed: Standard_Boolean, isVClosed: Standard_Boolean): void;
  static IsBSplUClosed(S: Handle_Geom_BSplineSurface, U1: Standard_Real, U2: Standard_Real, Tol: Standard_Real): Standard_Boolean;
  static IsBSplVClosed(S: Handle_Geom_BSplineSurface, V1: Standard_Real, V2: Standard_Real, Tol: Standard_Real): Standard_Boolean;
  static IsBzUClosed(S: Handle_Geom_BezierSurface, U1: Standard_Real, U2: Standard_Real, Tol: Standard_Real): Standard_Boolean;
  static IsBzVClosed(S: Handle_Geom_BezierSurface, V1: Standard_Real, V2: Standard_Real, Tol: Standard_Real): Standard_Boolean;
  static isIsoLine(theC2D: Handle_Adaptor2d_Curve2d, theIsU: Standard_Boolean, theParam: Standard_Real, theIsForward: Standard_Boolean): Standard_Boolean;
  static buildC3dOnIsoLine(theC2D: Handle_Adaptor2d_Curve2d, theSurf: Handle_Adaptor3d_Surface, theFirst: Standard_Real, theLast: Standard_Real, theTolerance: Standard_Real, theIsU: Standard_Boolean, theParam: Standard_Real, theIsForward: Standard_Boolean): Handle_Geom_Curve;
  delete(): void;
}

export declare class Poly_Connect {
  Load(theTriangulation: Handle_Poly_Triangulation): void;
  Triangulation(): Handle_Poly_Triangulation;
  Triangle(N: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Triangles(T: Graphic3d_ZLayerId, t1: Graphic3d_ZLayerId, t2: Graphic3d_ZLayerId, t3: Graphic3d_ZLayerId): void;
  Nodes(T: Graphic3d_ZLayerId, n1: Graphic3d_ZLayerId, n2: Graphic3d_ZLayerId, n3: Graphic3d_ZLayerId): void;
  Initialize(N: Graphic3d_ZLayerId): void;
  More(): Standard_Boolean;
  Next(): void;
  Value(): Graphic3d_ZLayerId;
  delete(): void;
}

  export declare class Poly_Connect_1 extends Poly_Connect {
    constructor();
  }

  export declare class Poly_Connect_2 extends Poly_Connect {
    constructor(theTriangulation: Handle_Poly_Triangulation);
  }

export declare class Handle_Poly_PolygonOnTriangulation {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Poly_PolygonOnTriangulation): void;
  get(): Poly_PolygonOnTriangulation;
  delete(): void;
}

  export declare class Handle_Poly_PolygonOnTriangulation_1 extends Handle_Poly_PolygonOnTriangulation {
    constructor();
  }

  export declare class Handle_Poly_PolygonOnTriangulation_2 extends Handle_Poly_PolygonOnTriangulation {
    constructor(thePtr: Poly_PolygonOnTriangulation);
  }

  export declare class Handle_Poly_PolygonOnTriangulation_3 extends Handle_Poly_PolygonOnTriangulation {
    constructor(theHandle: Handle_Poly_PolygonOnTriangulation);
  }

  export declare class Handle_Poly_PolygonOnTriangulation_4 extends Handle_Poly_PolygonOnTriangulation {
    constructor(theHandle: Handle_Poly_PolygonOnTriangulation);
  }

export declare class Poly_PolygonOnTriangulation extends Standard_Transient {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  Copy(): Handle_Poly_PolygonOnTriangulation;
  Deflection_1(): Standard_Real;
  Deflection_2(theDefl: Standard_Real): void;
  NbNodes(): Graphic3d_ZLayerId;
  Node(theIndex: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  SetNode(theIndex: Graphic3d_ZLayerId, theNode: Graphic3d_ZLayerId): void;
  HasParameters(): Standard_Boolean;
  Parameter(theIndex: Graphic3d_ZLayerId): Standard_Real;
  SetParameter(theIndex: Graphic3d_ZLayerId, theValue: Standard_Real): void;
  SetParameters(theParameters: Handle_TColStd_HArray1OfReal): void;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  Nodes(): TColStd_Array1OfInteger;
  Parameters(): Handle_TColStd_HArray1OfReal;
  ChangeNodes(): TColStd_Array1OfInteger;
  ChangeParameters(): IntTools_CArray1OfReal;
  delete(): void;
}

  export declare class Poly_PolygonOnTriangulation_1 extends Poly_PolygonOnTriangulation {
    constructor(theNbNodes: Graphic3d_ZLayerId, theHasParams: Standard_Boolean);
  }

  export declare class Poly_PolygonOnTriangulation_2 extends Poly_PolygonOnTriangulation {
    constructor(Nodes: TColStd_Array1OfInteger);
  }

  export declare class Poly_PolygonOnTriangulation_3 extends Poly_PolygonOnTriangulation {
    constructor(Nodes: TColStd_Array1OfInteger, Parameters: IntTools_CArray1OfReal);
  }

export declare class Poly_Triangle {
  Set_1(theN1: Graphic3d_ZLayerId, theN2: Graphic3d_ZLayerId, theN3: Graphic3d_ZLayerId): void;
  Set_2(theIndex: Graphic3d_ZLayerId, theNode: Graphic3d_ZLayerId): void;
  Get(theN1: Graphic3d_ZLayerId, theN2: Graphic3d_ZLayerId, theN3: Graphic3d_ZLayerId): void;
  Value(theIndex: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  ChangeValue(theIndex: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  delete(): void;
}

  export declare class Poly_Triangle_1 extends Poly_Triangle {
    constructor();
  }

  export declare class Poly_Triangle_2 extends Poly_Triangle {
    constructor(theN1: Graphic3d_ZLayerId, theN2: Graphic3d_ZLayerId, theN3: Graphic3d_ZLayerId);
  }

export declare class Poly_Array1OfTriangle {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: Poly_Triangle): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: Poly_Array1OfTriangle): Poly_Array1OfTriangle;
  Move(theOther: Poly_Array1OfTriangle): Poly_Array1OfTriangle;
  First(): Poly_Triangle;
  ChangeFirst(): Poly_Triangle;
  Last(): Poly_Triangle;
  ChangeLast(): Poly_Triangle;
  Value(theIndex: Standard_Integer): Poly_Triangle;
  ChangeValue(theIndex: Standard_Integer): Poly_Triangle;
  SetValue(theIndex: Standard_Integer, theItem: Poly_Triangle): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class Poly_Array1OfTriangle_1 extends Poly_Array1OfTriangle {
    constructor();
  }

  export declare class Poly_Array1OfTriangle_2 extends Poly_Array1OfTriangle {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class Poly_Array1OfTriangle_3 extends Poly_Array1OfTriangle {
    constructor(theOther: Poly_Array1OfTriangle);
  }

  export declare class Poly_Array1OfTriangle_4 extends Poly_Array1OfTriangle {
    constructor(theOther: Poly_Array1OfTriangle);
  }

  export declare class Poly_Array1OfTriangle_5 extends Poly_Array1OfTriangle {
    constructor(theBegin: Poly_Triangle, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class Handle_Poly_Triangulation {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Poly_Triangulation): void;
  get(): Poly_Triangulation;
  delete(): void;
}

  export declare class Handle_Poly_Triangulation_1 extends Handle_Poly_Triangulation {
    constructor();
  }

  export declare class Handle_Poly_Triangulation_2 extends Handle_Poly_Triangulation {
    constructor(thePtr: Poly_Triangulation);
  }

  export declare class Handle_Poly_Triangulation_3 extends Handle_Poly_Triangulation {
    constructor(theHandle: Handle_Poly_Triangulation);
  }

  export declare class Handle_Poly_Triangulation_4 extends Handle_Poly_Triangulation {
    constructor(theHandle: Handle_Poly_Triangulation);
  }

export declare class Poly_Triangulation extends Standard_Transient {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  Copy(): Handle_Poly_Triangulation;
  Deflection_1(): Standard_Real;
  Deflection_2(theDeflection: Standard_Real): void;
  Parameters_1(): Handle_Poly_TriangulationParameters;
  Parameters_2(theParams: Handle_Poly_TriangulationParameters): void;
  Clear(): void;
  HasGeometry(): Standard_Boolean;
  NbNodes(): Graphic3d_ZLayerId;
  NbTriangles(): Graphic3d_ZLayerId;
  HasUVNodes(): Standard_Boolean;
  HasNormals(): Standard_Boolean;
  Node(theIndex: Graphic3d_ZLayerId): gp_Pnt;
  SetNode(theIndex: Graphic3d_ZLayerId, thePnt: gp_Pnt): void;
  UVNode(theIndex: Graphic3d_ZLayerId): gp_Pnt2d;
  SetUVNode(theIndex: Graphic3d_ZLayerId, thePnt: gp_Pnt2d): void;
  Triangle(theIndex: Graphic3d_ZLayerId): Poly_Triangle;
  SetTriangle(theIndex: Graphic3d_ZLayerId, theTriangle: Poly_Triangle): void;
  Normal_1(theIndex: Graphic3d_ZLayerId): gp_Dir;
  Normal_2(theIndex: Graphic3d_ZLayerId, theVec3: gp_Vec3f): void;
  SetNormal_1(theIndex: Graphic3d_ZLayerId, theNormal: gp_Vec3f): void;
  SetNormal_2(theIndex: Graphic3d_ZLayerId, theNormal: gp_Dir): void;
  MeshPurpose(): Poly_MeshPurpose;
  SetMeshPurpose(thePurpose: Poly_MeshPurpose): void;
  CachedMinMax(): Bnd_Box;
  SetCachedMinMax(theBox: Bnd_Box): void;
  HasCachedMinMax(): Standard_Boolean;
  UpdateCachedMinMax(): void;
  MinMax(theBox: Bnd_Box, theTrsf: gp_Trsf, theIsAccurate: Standard_Boolean): Standard_Boolean;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  IsDoublePrecision(): Standard_Boolean;
  SetDoublePrecision(theIsDouble: Standard_Boolean): void;
  ResizeNodes(theNbNodes: Graphic3d_ZLayerId, theToCopyOld: Standard_Boolean): void;
  ResizeTriangles(theNbTriangles: Graphic3d_ZLayerId, theToCopyOld: Standard_Boolean): void;
  AddUVNodes(): void;
  RemoveUVNodes(): void;
  AddNormals(): void;
  RemoveNormals(): void;
  ComputeNormals(): void;
  MapNodeArray(): Handle_TColgp_HArray1OfPnt;
  MapTriangleArray(): Handle_Poly_HArray1OfTriangle;
  MapUVNodeArray(): Handle_TColgp_HArray1OfPnt2d;
  MapNormalArray(): Handle_TShort_HArray1OfShortReal;
  InternalTriangles(): Poly_Array1OfTriangle;
  InternalNodes(): Poly_ArrayOfNodes;
  InternalUVNodes(): Poly_ArrayOfUVNodes;
  InternalNormals(): any;
  SetNormals(theNormals: Handle_TShort_HArray1OfShortReal): void;
  Triangles(): Poly_Array1OfTriangle;
  ChangeTriangles(): Poly_Array1OfTriangle;
  ChangeTriangle(theIndex: Graphic3d_ZLayerId): Poly_Triangle;
  NbDeferredNodes(): Graphic3d_ZLayerId;
  NbDeferredTriangles(): Graphic3d_ZLayerId;
  HasDeferredData(): Standard_Boolean;
  LoadDeferredData(theFileSystem: any): Standard_Boolean;
  DetachedLoadDeferredData(theFileSystem: any): Handle_Poly_Triangulation;
  UnloadDeferredData(): Standard_Boolean;
  delete(): void;
}

  export declare class Poly_Triangulation_1 extends Poly_Triangulation {
    constructor();
  }

  export declare class Poly_Triangulation_2 extends Poly_Triangulation {
    constructor(theNbNodes: Graphic3d_ZLayerId, theNbTriangles: Graphic3d_ZLayerId, theHasUVNodes: Standard_Boolean, theHasNormals: Standard_Boolean);
  }

  export declare class Poly_Triangulation_3 extends Poly_Triangulation {
    constructor(Nodes: TColgp_Array1OfPnt, Triangles: Poly_Array1OfTriangle);
  }

  export declare class Poly_Triangulation_4 extends Poly_Triangulation {
    constructor(Nodes: TColgp_Array1OfPnt, UVNodes: TColgp_Array1OfPnt2d, Triangles: Poly_Array1OfTriangle);
  }

  export declare class Poly_Triangulation_5 extends Poly_Triangulation {
    constructor(theTriangulation: Handle_Poly_Triangulation);
  }

export declare class Handle_TColStd_HArray1OfBoolean {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: TColStd_HArray1OfBoolean): void;
  get(): TColStd_HArray1OfBoolean;
  delete(): void;
}

  export declare class Handle_TColStd_HArray1OfBoolean_1 extends Handle_TColStd_HArray1OfBoolean {
    constructor();
  }

  export declare class Handle_TColStd_HArray1OfBoolean_2 extends Handle_TColStd_HArray1OfBoolean {
    constructor(thePtr: TColStd_HArray1OfBoolean);
  }

  export declare class Handle_TColStd_HArray1OfBoolean_3 extends Handle_TColStd_HArray1OfBoolean {
    constructor(theHandle: Handle_TColStd_HArray1OfBoolean);
  }

  export declare class Handle_TColStd_HArray1OfBoolean_4 extends Handle_TColStd_HArray1OfBoolean {
    constructor(theHandle: Handle_TColStd_HArray1OfBoolean);
  }

export declare class TColStd_Array1OfInteger {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: Standard_Integer): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColStd_Array1OfInteger): TColStd_Array1OfInteger;
  Move(theOther: TColStd_Array1OfInteger): TColStd_Array1OfInteger;
  First(): Standard_Integer;
  ChangeFirst(): Standard_Integer;
  Last(): Standard_Integer;
  ChangeLast(): Standard_Integer;
  Value(theIndex: Standard_Integer): Standard_Integer;
  ChangeValue(theIndex: Standard_Integer): Standard_Integer;
  SetValue(theIndex: Standard_Integer, theItem: Standard_Integer): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColStd_Array1OfInteger_1 extends TColStd_Array1OfInteger {
    constructor();
  }

  export declare class TColStd_Array1OfInteger_2 extends TColStd_Array1OfInteger {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColStd_Array1OfInteger_3 extends TColStd_Array1OfInteger {
    constructor(theOther: TColStd_Array1OfInteger);
  }

  export declare class TColStd_Array1OfInteger_4 extends TColStd_Array1OfInteger {
    constructor(theOther: TColStd_Array1OfInteger);
  }

  export declare class TColStd_Array1OfInteger_5 extends TColStd_Array1OfInteger {
    constructor(theBegin: Standard_Integer, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class TColStd_Array1OfBoolean {
  begin(): any;
  end(): any;
  cbegin(): any;
  cend(): any;
  Init(theValue: Standard_Boolean): void;
  Size(): Standard_Integer;
  Length(): Standard_Integer;
  IsEmpty(): Standard_Boolean;
  Lower(): Standard_Integer;
  Upper(): Standard_Integer;
  IsDeletable(): Standard_Boolean;
  IsAllocated(): Standard_Boolean;
  Assign(theOther: TColStd_Array1OfBoolean): TColStd_Array1OfBoolean;
  Move(theOther: TColStd_Array1OfBoolean): TColStd_Array1OfBoolean;
  First(): Standard_Boolean;
  ChangeFirst(): Standard_Boolean;
  Last(): Standard_Boolean;
  ChangeLast(): Standard_Boolean;
  Value(theIndex: Standard_Integer): Standard_Boolean;
  ChangeValue(theIndex: Standard_Integer): Standard_Boolean;
  SetValue(theIndex: Standard_Integer, theItem: Standard_Boolean): void;
  Resize(theLower: Standard_Integer, theUpper: Standard_Integer, theToCopyData: Standard_Boolean): void;
  delete(): void;
}

  export declare class TColStd_Array1OfBoolean_1 extends TColStd_Array1OfBoolean {
    constructor();
  }

  export declare class TColStd_Array1OfBoolean_2 extends TColStd_Array1OfBoolean {
    constructor(theLower: Standard_Integer, theUpper: Standard_Integer);
  }

  export declare class TColStd_Array1OfBoolean_3 extends TColStd_Array1OfBoolean {
    constructor(theOther: TColStd_Array1OfBoolean);
  }

  export declare class TColStd_Array1OfBoolean_4 extends TColStd_Array1OfBoolean {
    constructor(theOther: TColStd_Array1OfBoolean);
  }

  export declare class TColStd_Array1OfBoolean_5 extends TColStd_Array1OfBoolean {
    constructor(theBegin: Standard_Boolean, theLower: Standard_Integer, theUpper: Standard_Integer);
  }

export declare class GCPnts_TangentialDeflection {
  Initialize_1(theC: Adaptor3d_Curve, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real): void;
  Initialize_2(theC: Adaptor3d_Curve, theFirstParameter: Standard_Real, theLastParameter: Standard_Real, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real): void;
  Initialize_3(theC: Adaptor2d_Curve2d, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real): void;
  Initialize_4(theC: Adaptor2d_Curve2d, theFirstParameter: Standard_Real, theLastParameter: Standard_Real, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real): void;
  AddPoint(thePnt: gp_Pnt, theParam: Standard_Real, theIsReplace: Standard_Boolean): Graphic3d_ZLayerId;
  NbPoints(): Graphic3d_ZLayerId;
  Parameter(I: Graphic3d_ZLayerId): Standard_Real;
  Value(I: Graphic3d_ZLayerId): gp_Pnt;
  static ArcAngularStep(theRadius: Standard_Real, theLinearDeflection: Standard_Real, theAngularDeflection: Standard_Real, theMinLength: Standard_Real): Standard_Real;
  delete(): void;
}

  export declare class GCPnts_TangentialDeflection_1 extends GCPnts_TangentialDeflection {
    constructor();
  }

  export declare class GCPnts_TangentialDeflection_2 extends GCPnts_TangentialDeflection {
    constructor(theC: Adaptor3d_Curve, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real);
  }

  export declare class GCPnts_TangentialDeflection_3 extends GCPnts_TangentialDeflection {
    constructor(theC: Adaptor3d_Curve, theFirstParameter: Standard_Real, theLastParameter: Standard_Real, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real);
  }

  export declare class GCPnts_TangentialDeflection_4 extends GCPnts_TangentialDeflection {
    constructor(theC: Adaptor2d_Curve2d, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real);
  }

  export declare class GCPnts_TangentialDeflection_5 extends GCPnts_TangentialDeflection {
    constructor(theC: Adaptor2d_Curve2d, theFirstParameter: Standard_Real, theLastParameter: Standard_Real, theAngularDeflection: Standard_Real, theCurvatureDeflection: Standard_Real, theMinimumOfPoints: Graphic3d_ZLayerId, theUTol: Standard_Real, theMinLen: Standard_Real);
  }

export declare class BRepFeat_MakeDPrism extends BRepFeat_Form {
  Init(Sbase: TopoDS_Shape, Pbase: TopoDS_Face, Skface: TopoDS_Face, Angle: Standard_Real, Fuse: Graphic3d_ZLayerId, Modify: Standard_Boolean): void;
  Add(E: TopoDS_Edge, OnFace: TopoDS_Face): void;
  Perform_1(Height: Standard_Real): void;
  Perform_2(Until: TopoDS_Shape): void;
  Perform_3(From: TopoDS_Shape, Until: TopoDS_Shape): void;
  PerformUntilEnd(): void;
  PerformFromEnd(FUntil: TopoDS_Shape): void;
  PerformThruAll(): void;
  PerformUntilHeight(Until: TopoDS_Shape, Height: Standard_Real): void;
  Curves(S: TColGeom_SequenceOfCurve): void;
  BarycCurve(): Handle_Geom_Curve;
  BossEdges(sig: Graphic3d_ZLayerId): void;
  TopEdges(): TopTools_ListOfShape;
  LatEdges(): TopTools_ListOfShape;
  delete(): void;
}

  export declare class BRepFeat_MakeDPrism_1 extends BRepFeat_MakeDPrism {
    constructor(Sbase: TopoDS_Shape, Pbase: TopoDS_Face, Skface: TopoDS_Face, Angle: Standard_Real, Fuse: Graphic3d_ZLayerId, Modify: Standard_Boolean);
  }

  export declare class BRepFeat_MakeDPrism_2 extends BRepFeat_MakeDPrism {
    constructor();
  }

export declare class BRepFeat_Form extends BRepBuilderAPI_MakeShape {
  Modified(F: TopoDS_Shape): TopTools_ListOfShape;
  Generated(S: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(S: TopoDS_Shape): Standard_Boolean;
  FirstShape(): TopTools_ListOfShape;
  LastShape(): TopTools_ListOfShape;
  NewEdges(): TopTools_ListOfShape;
  TgtEdges(): TopTools_ListOfShape;
  BasisShapeValid(): void;
  GeneratedShapeValid(): void;
  ShapeFromValid(): void;
  ShapeUntilValid(): void;
  GluedFacesValid(): void;
  SketchFaceValid(): void;
  PerfSelectionValid(): void;
  Curves(S: TColGeom_SequenceOfCurve): void;
  BarycCurve(): Handle_Geom_Curve;
  CurrentStatusError(): BRepFeat_StatusError;
  delete(): void;
}

export declare class GeomAPI_ProjectPointOnSurf {
  Init_1(P: gp_Pnt, Surface: Handle_Geom_Surface, Tolerance: Standard_Real, Algo: Extrema_ExtAlgo): void;
  Init_2(P: gp_Pnt, Surface: Handle_Geom_Surface, Algo: Extrema_ExtAlgo): void;
  Init_3(P: gp_Pnt, Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Tolerance: Standard_Real, Algo: Extrema_ExtAlgo): void;
  Init_4(P: gp_Pnt, Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Algo: Extrema_ExtAlgo): void;
  Init_5(Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Tolerance: Standard_Real, Algo: Extrema_ExtAlgo): void;
  Init_6(Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Algo: Extrema_ExtAlgo): void;
  SetExtremaAlgo(theAlgo: Extrema_ExtAlgo): void;
  SetExtremaFlag(theExtFlag: Extrema_ExtFlag): void;
  Perform(P: gp_Pnt): void;
  IsDone(): Standard_Boolean;
  NbPoints(): Graphic3d_ZLayerId;
  Point(Index: Graphic3d_ZLayerId): gp_Pnt;
  Parameters(Index: Graphic3d_ZLayerId, U: Standard_Real, V: Standard_Real): void;
  Distance(Index: Graphic3d_ZLayerId): Standard_Real;
  NearestPoint(): gp_Pnt;
  LowerDistanceParameters(U: Standard_Real, V: Standard_Real): void;
  LowerDistance(): Standard_Real;
  delete(): void;
}

  export declare class GeomAPI_ProjectPointOnSurf_1 extends GeomAPI_ProjectPointOnSurf {
    constructor();
  }

  export declare class GeomAPI_ProjectPointOnSurf_2 extends GeomAPI_ProjectPointOnSurf {
    constructor(P: gp_Pnt, Surface: Handle_Geom_Surface, Algo: Extrema_ExtAlgo);
  }

  export declare class GeomAPI_ProjectPointOnSurf_3 extends GeomAPI_ProjectPointOnSurf {
    constructor(P: gp_Pnt, Surface: Handle_Geom_Surface, Tolerance: Standard_Real, Algo: Extrema_ExtAlgo);
  }

  export declare class GeomAPI_ProjectPointOnSurf_4 extends GeomAPI_ProjectPointOnSurf {
    constructor(P: gp_Pnt, Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Tolerance: Standard_Real, Algo: Extrema_ExtAlgo);
  }

  export declare class GeomAPI_ProjectPointOnSurf_5 extends GeomAPI_ProjectPointOnSurf {
    constructor(P: gp_Pnt, Surface: Handle_Geom_Surface, Umin: Standard_Real, Usup: Standard_Real, Vmin: Standard_Real, Vsup: Standard_Real, Algo: Extrema_ExtAlgo);
  }

export declare class GeomAPI_ProjectPointOnCurve {
  Init_1(P: gp_Pnt, Curve: Handle_Geom_Curve): void;
  Init_2(P: gp_Pnt, Curve: Handle_Geom_Curve, Umin: Standard_Real, Usup: Standard_Real): void;
  Init_3(Curve: Handle_Geom_Curve, Umin: Standard_Real, Usup: Standard_Real): void;
  Perform(P: gp_Pnt): void;
  NbPoints(): Graphic3d_ZLayerId;
  Point(Index: Graphic3d_ZLayerId): gp_Pnt;
  Parameter_1(Index: Graphic3d_ZLayerId): Standard_Real;
  Parameter_2(Index: Graphic3d_ZLayerId, U: Standard_Real): void;
  Distance(Index: Graphic3d_ZLayerId): Standard_Real;
  NearestPoint(): gp_Pnt;
  LowerDistanceParameter(): Standard_Real;
  LowerDistance(): Standard_Real;
  Extrema(): Extrema_ExtPC;
  delete(): void;
}

  export declare class GeomAPI_ProjectPointOnCurve_1 extends GeomAPI_ProjectPointOnCurve {
    constructor();
  }

  export declare class GeomAPI_ProjectPointOnCurve_2 extends GeomAPI_ProjectPointOnCurve {
    constructor(P: gp_Pnt, Curve: Handle_Geom_Curve);
  }

  export declare class GeomAPI_ProjectPointOnCurve_3 extends GeomAPI_ProjectPointOnCurve {
    constructor(P: gp_Pnt, Curve: Handle_Geom_Curve, Umin: Standard_Real, Usup: Standard_Real);
  }

export declare class GeomAPI_PointsToBSpline {
  Init_1(Points: TColgp_Array1OfPnt, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Init_2(Points: TColgp_Array1OfPnt, ParType: Approx_ParametrizationType, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Init_3(Points: TColgp_Array1OfPnt, Parameters: IntTools_CArray1OfReal, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Init_4(Points: TColgp_Array1OfPnt, Weight1: Standard_Real, Weight2: Standard_Real, Weight3: Standard_Real, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Curve(): Handle_Geom_BSplineCurve;
  IsDone(): Standard_Boolean;
  delete(): void;
}

  export declare class GeomAPI_PointsToBSpline_1 extends GeomAPI_PointsToBSpline {
    constructor();
  }

  export declare class GeomAPI_PointsToBSpline_2 extends GeomAPI_PointsToBSpline {
    constructor(Points: TColgp_Array1OfPnt, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSpline_3 extends GeomAPI_PointsToBSpline {
    constructor(Points: TColgp_Array1OfPnt, ParType: Approx_ParametrizationType, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSpline_4 extends GeomAPI_PointsToBSpline {
    constructor(Points: TColgp_Array1OfPnt, Parameters: IntTools_CArray1OfReal, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSpline_5 extends GeomAPI_PointsToBSpline {
    constructor(Points: TColgp_Array1OfPnt, Weight1: Standard_Real, Weight2: Standard_Real, Weight3: Standard_Real, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

export declare class GeomAPI_PointsToBSplineSurface {
  Init_1(Points: TColgp_Array2OfPnt, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Interpolate_1(Points: TColgp_Array2OfPnt, thePeriodic: Standard_Boolean): void;
  Interpolate_2(Points: TColgp_Array2OfPnt, ParType: Approx_ParametrizationType, thePeriodic: Standard_Boolean): void;
  Init_2(ZPoints: TColStd_Array2OfReal, X0: Standard_Real, dX: Standard_Real, Y0: Standard_Real, dY: Standard_Real, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Interpolate_3(ZPoints: TColStd_Array2OfReal, X0: Standard_Real, dX: Standard_Real, Y0: Standard_Real, dY: Standard_Real): void;
  Init_3(Points: TColgp_Array2OfPnt, ParType: Approx_ParametrizationType, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real, thePeriodic: Standard_Boolean): void;
  Init_4(Points: TColgp_Array2OfPnt, Weight1: Standard_Real, Weight2: Standard_Real, Weight3: Standard_Real, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real): void;
  Surface(): Handle_Geom_BSplineSurface;
  IsDone(): Standard_Boolean;
  delete(): void;
}

  export declare class GeomAPI_PointsToBSplineSurface_1 extends GeomAPI_PointsToBSplineSurface {
    constructor();
  }

  export declare class GeomAPI_PointsToBSplineSurface_2 extends GeomAPI_PointsToBSplineSurface {
    constructor(Points: TColgp_Array2OfPnt, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSplineSurface_3 extends GeomAPI_PointsToBSplineSurface {
    constructor(Points: TColgp_Array2OfPnt, ParType: Approx_ParametrizationType, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSplineSurface_4 extends GeomAPI_PointsToBSplineSurface {
    constructor(Points: TColgp_Array2OfPnt, Weight1: Standard_Real, Weight2: Standard_Real, Weight3: Standard_Real, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

  export declare class GeomAPI_PointsToBSplineSurface_5 extends GeomAPI_PointsToBSplineSurface {
    constructor(ZPoints: TColStd_Array2OfReal, X0: Standard_Real, dX: Standard_Real, Y0: Standard_Real, dY: Standard_Real, DegMin: Graphic3d_ZLayerId, DegMax: Graphic3d_ZLayerId, Continuity: GeomAbs_Shape, Tol3D: Standard_Real);
  }

export declare class GeomAPI_Interpolate {
  Load_1(InitialTangent: gp_Vec, FinalTangent: gp_Vec, Scale: Standard_Boolean): void;
  Load_2(Tangents: TColgp_Array1OfVec, TangentFlags: Handle_TColStd_HArray1OfBoolean, Scale: Standard_Boolean): void;
  Perform(): void;
  Curve(): Handle_Geom_BSplineCurve;
  IsDone(): Standard_Boolean;
  delete(): void;
}

  export declare class GeomAPI_Interpolate_1 extends GeomAPI_Interpolate {
    constructor(Points: Handle_TColgp_HArray1OfPnt, PeriodicFlag: Standard_Boolean, Tolerance: Standard_Real);
  }

  export declare class GeomAPI_Interpolate_2 extends GeomAPI_Interpolate {
    constructor(Points: Handle_TColgp_HArray1OfPnt, Parameters: Handle_TColStd_HArray1OfReal, PeriodicFlag: Standard_Boolean, Tolerance: Standard_Real);
  }

export declare class BRepBndLib {
  constructor();
  static Add(S: TopoDS_Shape, B: Bnd_Box, useTriangulation: Standard_Boolean): void;
  static AddClose(S: TopoDS_Shape, B: Bnd_Box): void;
  static AddOptimal(S: TopoDS_Shape, B: Bnd_Box, useTriangulation: Standard_Boolean, useShapeTolerance: Standard_Boolean): void;
  static AddOBB(theS: TopoDS_Shape, theOBB: Bnd_OBB, theIsTriangulationUsed: Standard_Boolean, theIsOptimal: Standard_Boolean, theIsShapeToleranceUsed: Standard_Boolean): void;
  delete(): void;
}

export declare class ShapeFix_Face extends ShapeFix_Root {
  ClearModes(): void;
  Init_1(face: TopoDS_Face): void;
  Init_2(surf: Handle_Geom_Surface, preci: Standard_Real, fwd: Standard_Boolean): void;
  Init_3(surf: Handle_ShapeAnalysis_Surface, preci: Standard_Real, fwd: Standard_Boolean): void;
  SetMsgRegistrator(msgreg: Handle_ShapeExtend_BasicMsgRegistrator): void;
  SetPrecision(preci: Standard_Real): void;
  SetMinTolerance(mintol: Standard_Real): void;
  SetMaxTolerance(maxtol: Standard_Real): void;
  FixWireMode(): Graphic3d_ZLayerId;
  FixOrientationMode(): Graphic3d_ZLayerId;
  FixAddNaturalBoundMode(): Graphic3d_ZLayerId;
  FixMissingSeamMode(): Graphic3d_ZLayerId;
  FixSmallAreaWireMode(): Graphic3d_ZLayerId;
  RemoveSmallAreaFaceMode(): Graphic3d_ZLayerId;
  FixIntersectingWiresMode(): Graphic3d_ZLayerId;
  FixLoopWiresMode(): Graphic3d_ZLayerId;
  FixSplitFaceMode(): Graphic3d_ZLayerId;
  AutoCorrectPrecisionMode(): Graphic3d_ZLayerId;
  FixPeriodicDegeneratedMode(): Graphic3d_ZLayerId;
  Face(): TopoDS_Face;
  Result(): TopoDS_Shape;
  Add(wire: TopoDS_Wire): void;
  Perform(): Standard_Boolean;
  FixOrientation_1(): Standard_Boolean;
  FixOrientation_2(MapWires: TopTools_DataMapOfShapeListOfShape): Standard_Boolean;
  FixAddNaturalBound(): Standard_Boolean;
  FixMissingSeam(): Standard_Boolean;
  FixSmallAreaWire(theIsRemoveSmallFace: Standard_Boolean): Standard_Boolean;
  FixLoopWire(aResWires: TopTools_SequenceOfShape): Standard_Boolean;
  FixIntersectingWires(): Standard_Boolean;
  FixWiresTwoCoincEdges(): Standard_Boolean;
  FixSplitFace(MapWires: TopTools_DataMapOfShapeListOfShape): Standard_Boolean;
  FixPeriodicDegenerated(): Standard_Boolean;
  Status(status: ShapeExtend_Status): Standard_Boolean;
  FixWireTool(): Handle_ShapeFix_Wire;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeFix_Face_1 extends ShapeFix_Face {
    constructor();
  }

  export declare class ShapeFix_Face_2 extends ShapeFix_Face {
    constructor(face: TopoDS_Face);
  }

export declare class ShapeFix_Wire extends ShapeFix_Root {
  ClearModes(): void;
  ClearStatuses(): void;
  Init_1(wire: TopoDS_Wire, face: TopoDS_Face, prec: Standard_Real): void;
  Init_2(saw: Handle_ShapeAnalysis_Wire): void;
  Load_1(wire: TopoDS_Wire): void;
  Load_2(sbwd: Handle_ShapeExtend_WireData): void;
  SetFace(face: TopoDS_Face): void;
  SetSurface_1(surf: Handle_Geom_Surface): void;
  SetSurface_2(surf: Handle_Geom_Surface, loc: TopLoc_Location): void;
  SetPrecision(prec: Standard_Real): void;
  SetMaxTailAngle(theMaxTailAngle: Standard_Real): void;
  SetMaxTailWidth(theMaxTailWidth: Standard_Real): void;
  IsLoaded(): Standard_Boolean;
  IsReady(): Standard_Boolean;
  NbEdges(): Graphic3d_ZLayerId;
  Wire(): TopoDS_Wire;
  WireAPIMake(): TopoDS_Wire;
  Analyzer(): Handle_ShapeAnalysis_Wire;
  WireData(): Handle_ShapeExtend_WireData;
  Face(): TopoDS_Face;
  ModifyTopologyMode(): Standard_Boolean;
  ModifyGeometryMode(): Standard_Boolean;
  ModifyRemoveLoopMode(): Graphic3d_ZLayerId;
  ClosedWireMode(): Standard_Boolean;
  PreferencePCurveMode(): Standard_Boolean;
  FixGapsByRangesMode(): Standard_Boolean;
  FixReorderMode(): Graphic3d_ZLayerId;
  FixSmallMode(): Graphic3d_ZLayerId;
  FixConnectedMode(): Graphic3d_ZLayerId;
  FixEdgeCurvesMode(): Graphic3d_ZLayerId;
  FixDegeneratedMode(): Graphic3d_ZLayerId;
  FixSelfIntersectionMode(): Graphic3d_ZLayerId;
  FixLackingMode(): Graphic3d_ZLayerId;
  FixGaps3dMode(): Graphic3d_ZLayerId;
  FixGaps2dMode(): Graphic3d_ZLayerId;
  FixReversed2dMode(): Graphic3d_ZLayerId;
  FixRemovePCurveMode(): Graphic3d_ZLayerId;
  FixAddPCurveMode(): Graphic3d_ZLayerId;
  FixRemoveCurve3dMode(): Graphic3d_ZLayerId;
  FixAddCurve3dMode(): Graphic3d_ZLayerId;
  FixSeamMode(): Graphic3d_ZLayerId;
  FixShiftedMode(): Graphic3d_ZLayerId;
  FixSameParameterMode(): Graphic3d_ZLayerId;
  FixVertexToleranceMode(): Graphic3d_ZLayerId;
  FixNotchedEdgesMode(): Graphic3d_ZLayerId;
  FixSelfIntersectingEdgeMode(): Graphic3d_ZLayerId;
  FixIntersectingEdgesMode(): Graphic3d_ZLayerId;
  FixNonAdjacentIntersectingEdgesMode(): Graphic3d_ZLayerId;
  FixTailMode(): Graphic3d_ZLayerId;
  Perform(): Standard_Boolean;
  FixReorder_1(): Standard_Boolean;
  FixSmall_1(lockvtx: Standard_Boolean, precsmall: Standard_Real): Graphic3d_ZLayerId;
  FixConnected_1(prec: Standard_Real): Standard_Boolean;
  FixEdgeCurves(): Standard_Boolean;
  FixDegenerated_1(): Standard_Boolean;
  FixSelfIntersection(): Standard_Boolean;
  FixLacking_1(force: Standard_Boolean): Standard_Boolean;
  FixClosed(prec: Standard_Real): Standard_Boolean;
  FixGaps3d(): Standard_Boolean;
  FixGaps2d(): Standard_Boolean;
  FixReorder_2(wi: ShapeAnalysis_WireOrder): Standard_Boolean;
  FixSmall_2(num: Graphic3d_ZLayerId, lockvtx: Standard_Boolean, precsmall: Standard_Real): Standard_Boolean;
  FixConnected_2(num: Graphic3d_ZLayerId, prec: Standard_Real): Standard_Boolean;
  FixSeam(num: Graphic3d_ZLayerId): Standard_Boolean;
  FixShifted(): Standard_Boolean;
  FixDegenerated_2(num: Graphic3d_ZLayerId): Standard_Boolean;
  FixLacking_2(num: Graphic3d_ZLayerId, force: Standard_Boolean): Standard_Boolean;
  FixNotchedEdges(): Standard_Boolean;
  FixGap3d(num: Graphic3d_ZLayerId, convert: Standard_Boolean): Standard_Boolean;
  FixGap2d(num: Graphic3d_ZLayerId, convert: Standard_Boolean): Standard_Boolean;
  FixTails(): Standard_Boolean;
  StatusReorder(status: ShapeExtend_Status): Standard_Boolean;
  StatusSmall(status: ShapeExtend_Status): Standard_Boolean;
  StatusConnected(status: ShapeExtend_Status): Standard_Boolean;
  StatusEdgeCurves(status: ShapeExtend_Status): Standard_Boolean;
  StatusDegenerated(status: ShapeExtend_Status): Standard_Boolean;
  StatusSelfIntersection(status: ShapeExtend_Status): Standard_Boolean;
  StatusLacking(status: ShapeExtend_Status): Standard_Boolean;
  StatusClosed(status: ShapeExtend_Status): Standard_Boolean;
  StatusGaps3d(status: ShapeExtend_Status): Standard_Boolean;
  StatusGaps2d(status: ShapeExtend_Status): Standard_Boolean;
  StatusNotches(status: ShapeExtend_Status): Standard_Boolean;
  StatusRemovedSegment(): Standard_Boolean;
  StatusFixTails(status: ShapeExtend_Status): Standard_Boolean;
  LastFixStatus(status: ShapeExtend_Status): Standard_Boolean;
  FixEdgeTool(): Handle_ShapeFix_Edge;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeFix_Wire_1 extends ShapeFix_Wire {
    constructor();
  }

  export declare class ShapeFix_Wire_2 extends ShapeFix_Wire {
    constructor(wire: TopoDS_Wire, face: TopoDS_Face, prec: Standard_Real);
  }

export declare class ShapeFix_Shape extends ShapeFix_Root {
  Init(shape: TopoDS_Shape): void;
  Perform(theProgress: Message_ProgressRange): Standard_Boolean;
  Shape(): TopoDS_Shape;
  FixSolidTool(): Handle_ShapeFix_Solid;
  FixShellTool(): Handle_ShapeFix_Shell;
  FixFaceTool(): Handle_ShapeFix_Face;
  FixWireTool(): Handle_ShapeFix_Wire;
  FixEdgeTool(): Handle_ShapeFix_Edge;
  Status(status: ShapeExtend_Status): Standard_Boolean;
  SetMsgRegistrator(msgreg: Handle_ShapeExtend_BasicMsgRegistrator): void;
  SetPrecision(preci: Standard_Real): void;
  SetMinTolerance(mintol: Standard_Real): void;
  SetMaxTolerance(maxtol: Standard_Real): void;
  FixSolidMode(): Graphic3d_ZLayerId;
  FixFreeShellMode(): Graphic3d_ZLayerId;
  FixFreeFaceMode(): Graphic3d_ZLayerId;
  FixFreeWireMode(): Graphic3d_ZLayerId;
  FixSameParameterMode(): Graphic3d_ZLayerId;
  FixVertexPositionMode(): Graphic3d_ZLayerId;
  FixVertexTolMode(): Graphic3d_ZLayerId;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeFix_Shape_1 extends ShapeFix_Shape {
    constructor();
  }

  export declare class ShapeFix_Shape_2 extends ShapeFix_Shape {
    constructor(shape: TopoDS_Shape);
  }

export declare class ShapeFix_Root extends Standard_Transient {
  constructor()
  Set(Root: Handle_ShapeFix_Root): void;
  SetContext(context: Handle_ShapeBuild_ReShape): void;
  Context(): Handle_ShapeBuild_ReShape;
  SetMsgRegistrator(msgreg: Handle_ShapeExtend_BasicMsgRegistrator): void;
  MsgRegistrator(): Handle_ShapeExtend_BasicMsgRegistrator;
  SetPrecision(preci: Standard_Real): void;
  Precision(): Standard_Real;
  SetMinTolerance(mintol: Standard_Real): void;
  MinTolerance(): Standard_Real;
  SetMaxTolerance(maxtol: Standard_Real): void;
  MaxTolerance(): Standard_Real;
  LimitTolerance(toler: Standard_Real): Standard_Real;
  SendMsg_1(shape: TopoDS_Shape, message: Message_Msg, gravity: Message_Gravity): void;
  SendMsg_2(message: Message_Msg, gravity: Message_Gravity): void;
  SendWarning_1(shape: TopoDS_Shape, message: Message_Msg): void;
  SendWarning_2(message: Message_Msg): void;
  SendFail_1(shape: TopoDS_Shape, message: Message_Msg): void;
  SendFail_2(message: Message_Msg): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class ShapeFix_Solid extends ShapeFix_Root {
  Init(solid: TopoDS_Solid): void;
  Perform(theProgress: Message_ProgressRange): Standard_Boolean;
  SolidFromShell(shell: TopoDS_Shell): TopoDS_Solid;
  Status(status: ShapeExtend_Status): Standard_Boolean;
  Solid(): TopoDS_Shape;
  FixShellTool(): Handle_ShapeFix_Shell;
  SetMsgRegistrator(msgreg: Handle_ShapeExtend_BasicMsgRegistrator): void;
  SetPrecision(preci: Standard_Real): void;
  SetMinTolerance(mintol: Standard_Real): void;
  SetMaxTolerance(maxtol: Standard_Real): void;
  FixShellMode(): Graphic3d_ZLayerId;
  FixShellOrientationMode(): Graphic3d_ZLayerId;
  CreateOpenSolidMode(): Standard_Boolean;
  Shape(): TopoDS_Shape;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeFix_Solid_1 extends ShapeFix_Solid {
    constructor();
  }

  export declare class ShapeFix_Solid_2 extends ShapeFix_Solid {
    constructor(solid: TopoDS_Solid);
  }

export declare class GeomLProp_CLProps {
  SetParameter(U: Standard_Real): void;
  SetCurve(C: Handle_Geom_Curve): void;
  Value(): gp_Pnt;
  D1(): gp_Vec;
  D2(): gp_Vec;
  D3(): gp_Vec;
  IsTangentDefined(): Standard_Boolean;
  Tangent(D: gp_Dir): void;
  Curvature(): Standard_Real;
  Normal(N: gp_Dir): void;
  CentreOfCurvature(P: gp_Pnt): void;
  delete(): void;
}

  export declare class GeomLProp_CLProps_1 extends GeomLProp_CLProps {
    constructor(C: Handle_Geom_Curve, N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

  export declare class GeomLProp_CLProps_2 extends GeomLProp_CLProps {
    constructor(C: Handle_Geom_Curve, U: Standard_Real, N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

  export declare class GeomLProp_CLProps_3 extends GeomLProp_CLProps {
    constructor(N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

export declare class GeomLProp_SLProps {
  SetSurface(S: Handle_Geom_Surface): void;
  SetParameters(U: Standard_Real, V: Standard_Real): void;
  Value(): gp_Pnt;
  D1U(): gp_Vec;
  D1V(): gp_Vec;
  D2U(): gp_Vec;
  D2V(): gp_Vec;
  DUV(): gp_Vec;
  IsTangentUDefined(): Standard_Boolean;
  TangentU(D: gp_Dir): void;
  IsTangentVDefined(): Standard_Boolean;
  TangentV(D: gp_Dir): void;
  IsNormalDefined(): Standard_Boolean;
  Normal(): gp_Dir;
  IsCurvatureDefined(): Standard_Boolean;
  IsUmbilic(): Standard_Boolean;
  MaxCurvature(): Standard_Real;
  MinCurvature(): Standard_Real;
  CurvatureDirections(MaxD: gp_Dir, MinD: gp_Dir): void;
  MeanCurvature(): Standard_Real;
  GaussianCurvature(): Standard_Real;
  delete(): void;
}

  export declare class GeomLProp_SLProps_1 extends GeomLProp_SLProps {
    constructor(S: Handle_Geom_Surface, U: Standard_Real, V: Standard_Real, N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

  export declare class GeomLProp_SLProps_2 extends GeomLProp_SLProps {
    constructor(S: Handle_Geom_Surface, N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

  export declare class GeomLProp_SLProps_3 extends GeomLProp_SLProps {
    constructor(N: Graphic3d_ZLayerId, Resolution: Standard_Real);
  }

export declare class NCollection_BaseList {
  Extent(): Graphic3d_ZLayerId;
  IsEmpty(): Standard_Boolean;
  Allocator(): Handle_NCollection_BaseAllocator;
  delete(): void;
}

export declare class BRepGProp {
  constructor();
  static LinearProperties(S: TopoDS_Shape, LProps: GProp_GProps, SkipShared: Standard_Boolean, UseTriangulation: Standard_Boolean): void;
  static SurfaceProperties_1(S: TopoDS_Shape, SProps: GProp_GProps, SkipShared: Standard_Boolean, UseTriangulation: Standard_Boolean): void;
  static SurfaceProperties_2(S: TopoDS_Shape, SProps: GProp_GProps, Eps: Standard_Real, SkipShared: Standard_Boolean): Standard_Real;
  static VolumeProperties_1(S: TopoDS_Shape, VProps: GProp_GProps, OnlyClosed: Standard_Boolean, SkipShared: Standard_Boolean, UseTriangulation: Standard_Boolean): void;
  static VolumeProperties_2(S: TopoDS_Shape, VProps: GProp_GProps, Eps: Standard_Real, OnlyClosed: Standard_Boolean, SkipShared: Standard_Boolean): Standard_Real;
  static VolumePropertiesGK_1(S: TopoDS_Shape, VProps: GProp_GProps, Eps: Standard_Real, OnlyClosed: Standard_Boolean, IsUseSpan: Standard_Boolean, CGFlag: Standard_Boolean, IFlag: Standard_Boolean, SkipShared: Standard_Boolean): Standard_Real;
  static VolumePropertiesGK_2(S: TopoDS_Shape, VProps: GProp_GProps, thePln: gp_Pln, Eps: Standard_Real, OnlyClosed: Standard_Boolean, IsUseSpan: Standard_Boolean, CGFlag: Standard_Boolean, IFlag: Standard_Boolean, SkipShared: Standard_Boolean): Standard_Real;
  delete(): void;
}

export declare class BRepGProp_Face {
  Load_1(F: TopoDS_Face): void;
  VIntegrationOrder(): Graphic3d_ZLayerId;
  NaturalRestriction(): Standard_Boolean;
  GetFace(): TopoDS_Face;
  Value2d(U: Standard_Real): gp_Pnt2d;
  SIntOrder(Eps: Standard_Real): Graphic3d_ZLayerId;
  SVIntSubs(): Graphic3d_ZLayerId;
  SUIntSubs(): Graphic3d_ZLayerId;
  UKnots(Knots: IntTools_CArray1OfReal): void;
  VKnots(Knots: IntTools_CArray1OfReal): void;
  LIntOrder(Eps: Standard_Real): Graphic3d_ZLayerId;
  LIntSubs(): Graphic3d_ZLayerId;
  LKnots(Knots: IntTools_CArray1OfReal): void;
  UIntegrationOrder(): Graphic3d_ZLayerId;
  Bounds(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  Normal(U: Standard_Real, V: Standard_Real, P: gp_Pnt, VNor: gp_Vec): void;
  Load_2(E: TopoDS_Edge): Standard_Boolean;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IntegrationOrder(): Graphic3d_ZLayerId;
  D12d(U: Standard_Real, P: gp_Pnt2d, V1: gp_Vec2d): void;
  Load_3(IsFirstParam: Standard_Boolean, theIsoType: GeomAbs_IsoType): void;
  GetUKnots(theUMin: Standard_Real, theUMax: Standard_Real, theUKnots: Handle_TColStd_HArray1OfReal): void;
  GetTKnots(theTMin: Standard_Real, theTMax: Standard_Real, theTKnots: Handle_TColStd_HArray1OfReal): void;
  delete(): void;
}

  export declare class BRepGProp_Face_1 extends BRepGProp_Face {
    constructor(IsUseSpan: Standard_Boolean);
  }

  export declare class BRepGProp_Face_2 extends BRepGProp_Face {
    constructor(F: TopoDS_Face, IsUseSpan: Standard_Boolean);
  }

export declare class Geom_ElementarySurface extends Geom_Surface {
  SetAxis(theA1: gp_Ax1): void;
  SetLocation(theLoc: gp_Pnt): void;
  SetPosition(theAx3: gp_Ax3): void;
  Axis(): gp_Ax1;
  Location(): gp_Pnt;
  Position(): gp_Ax3;
  UReverse(): void;
  UReversedParameter(U: Standard_Real): Standard_Real;
  VReverse(): void;
  VReversedParameter(V: Standard_Real): Standard_Real;
  Continuity(): GeomAbs_Shape;
  IsCNu(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsCNv(N: Graphic3d_ZLayerId): Standard_Boolean;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom_TrimmedCurve extends Geom_BoundedCurve {
  constructor(C: Handle_Geom_Curve, U1: Standard_Real, U2: Standard_Real, Sense: Standard_Boolean, theAdjustPeriodic: Standard_Boolean)
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  SetTrim(U1: Standard_Real, U2: Standard_Real, Sense: Standard_Boolean, theAdjustPeriodic: Standard_Boolean): void;
  BasisCurve(): Handle_Geom_Curve;
  Continuity(): GeomAbs_Shape;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  EndPoint(): gp_Pnt;
  FirstParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  LastParameter(): Standard_Real;
  StartPoint(): gp_Pnt;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V1: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  Transform(T: gp_Trsf): void;
  TransformedParameter(U: Standard_Real, T: gp_Trsf): Standard_Real;
  ParametricTransformation(T: gp_Trsf): Standard_Real;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Handle_Geom_TrimmedCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_TrimmedCurve): void;
  get(): Geom_TrimmedCurve;
  delete(): void;
}

  export declare class Handle_Geom_TrimmedCurve_1 extends Handle_Geom_TrimmedCurve {
    constructor();
  }

  export declare class Handle_Geom_TrimmedCurve_2 extends Handle_Geom_TrimmedCurve {
    constructor(thePtr: Geom_TrimmedCurve);
  }

  export declare class Handle_Geom_TrimmedCurve_3 extends Handle_Geom_TrimmedCurve {
    constructor(theHandle: Handle_Geom_TrimmedCurve);
  }

  export declare class Handle_Geom_TrimmedCurve_4 extends Handle_Geom_TrimmedCurve {
    constructor(theHandle: Handle_Geom_TrimmedCurve);
  }

export declare class Geom_BoundedCurve extends Geom_Curve {
  EndPoint(): gp_Pnt;
  StartPoint(): gp_Pnt;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom_BSplineCurve extends Geom_BoundedCurve {
  IncreaseDegree(Degree: Graphic3d_ZLayerId): void;
  IncreaseMultiplicity_1(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncreaseMultiplicity_2(I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncrementMultiplicity(I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  InsertKnot(U: Standard_Real, M: Graphic3d_ZLayerId, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  InsertKnots(Knots: IntTools_CArray1OfReal, Mults: TColStd_Array1OfInteger, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  RemoveKnot(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId, Tolerance: Standard_Real): Standard_Boolean;
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Segment(U1: Standard_Real, U2: Standard_Real, theTolerance: Standard_Real): void;
  SetKnot_1(Index: Graphic3d_ZLayerId, K: Standard_Real): void;
  SetKnots(K: IntTools_CArray1OfReal): void;
  SetKnot_2(Index: Graphic3d_ZLayerId, K: Standard_Real, M: Graphic3d_ZLayerId): void;
  PeriodicNormalization(U: Standard_Real): void;
  SetPeriodic(): void;
  SetOrigin_1(Index: Graphic3d_ZLayerId): void;
  SetOrigin_2(U: Standard_Real, Tol: Standard_Real): void;
  SetNotPeriodic(): void;
  SetPole_1(Index: Graphic3d_ZLayerId, P: gp_Pnt): void;
  SetPole_2(Index: Graphic3d_ZLayerId, P: gp_Pnt, Weight: Standard_Real): void;
  SetWeight(Index: Graphic3d_ZLayerId, Weight: Standard_Real): void;
  MovePoint(U: Standard_Real, P: gp_Pnt, Index1: Graphic3d_ZLayerId, Index2: Graphic3d_ZLayerId, FirstModifiedPole: Graphic3d_ZLayerId, LastModifiedPole: Graphic3d_ZLayerId): void;
  MovePointAndTangent(U: Standard_Real, P: gp_Pnt, Tangent: gp_Vec, Tolerance: Standard_Real, StartingCondition: Graphic3d_ZLayerId, EndingCondition: Graphic3d_ZLayerId, ErrorStatus: Graphic3d_ZLayerId): void;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsG1(theTf: Standard_Real, theTl: Standard_Real, theAngTol: Standard_Real): Standard_Boolean;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  IsRational(): Standard_Boolean;
  Continuity(): GeomAbs_Shape;
  Degree(): Graphic3d_ZLayerId;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V1: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  LocalValue(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId): gp_Pnt;
  LocalD0(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt): void;
  LocalD1(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt, V1: gp_Vec): void;
  LocalD2(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  LocalD3(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  LocalDN(U: Standard_Real, FromK1: Graphic3d_ZLayerId, ToK2: Graphic3d_ZLayerId, N: Graphic3d_ZLayerId): gp_Vec;
  EndPoint(): gp_Pnt;
  FirstUKnotIndex(): Graphic3d_ZLayerId;
  FirstParameter(): Standard_Real;
  Knot(Index: Graphic3d_ZLayerId): Standard_Real;
  Knots_1(K: IntTools_CArray1OfReal): void;
  Knots_2(): IntTools_CArray1OfReal;
  KnotSequence_1(K: IntTools_CArray1OfReal): void;
  KnotSequence_2(): IntTools_CArray1OfReal;
  KnotDistribution(): GeomAbs_BSplKnotDistribution;
  LastUKnotIndex(): Graphic3d_ZLayerId;
  LastParameter(): Standard_Real;
  LocateU(U: Standard_Real, ParametricTolerance: Standard_Real, I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, WithKnotRepetition: Standard_Boolean): void;
  Multiplicity(Index: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Multiplicities_1(M: TColStd_Array1OfInteger): void;
  Multiplicities_2(): TColStd_Array1OfInteger;
  NbKnots(): Graphic3d_ZLayerId;
  NbPoles(): Graphic3d_ZLayerId;
  Pole(Index: Graphic3d_ZLayerId): gp_Pnt;
  Poles_1(P: TColgp_Array1OfPnt): void;
  Poles_2(): TColgp_Array1OfPnt;
  StartPoint(): gp_Pnt;
  Weight(Index: Graphic3d_ZLayerId): Standard_Real;
  Weights_1(W: IntTools_CArray1OfReal): void;
  Weights_2(): IntTools_CArray1OfReal;
  Transform(T: gp_Trsf): void;
  static MaxDegree(): Graphic3d_ZLayerId;
  Resolution(Tolerance3D: Standard_Real, UTolerance: Standard_Real): void;
  Copy(): Handle_Geom_Geometry;
  IsEqual(theOther: Handle_Geom_BSplineCurve, thePreci: Standard_Real): Standard_Boolean;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom_BSplineCurve_1 extends Geom_BSplineCurve {
    constructor(Poles: TColgp_Array1OfPnt, Knots: IntTools_CArray1OfReal, Multiplicities: TColStd_Array1OfInteger, Degree: Graphic3d_ZLayerId, Periodic: Standard_Boolean);
  }

  export declare class Geom_BSplineCurve_2 extends Geom_BSplineCurve {
    constructor(Poles: TColgp_Array1OfPnt, Weights: IntTools_CArray1OfReal, Knots: IntTools_CArray1OfReal, Multiplicities: TColStd_Array1OfInteger, Degree: Graphic3d_ZLayerId, Periodic: Standard_Boolean, CheckRational: Standard_Boolean);
  }

export declare class Handle_Geom_BSplineCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_BSplineCurve): void;
  get(): Geom_BSplineCurve;
  delete(): void;
}

  export declare class Handle_Geom_BSplineCurve_1 extends Handle_Geom_BSplineCurve {
    constructor();
  }

  export declare class Handle_Geom_BSplineCurve_2 extends Handle_Geom_BSplineCurve {
    constructor(thePtr: Geom_BSplineCurve);
  }

  export declare class Handle_Geom_BSplineCurve_3 extends Handle_Geom_BSplineCurve {
    constructor(theHandle: Handle_Geom_BSplineCurve);
  }

  export declare class Handle_Geom_BSplineCurve_4 extends Handle_Geom_BSplineCurve {
    constructor(theHandle: Handle_Geom_BSplineCurve);
  }

export declare class Handle_Geom_BSplineSurface {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_BSplineSurface): void;
  get(): Geom_BSplineSurface;
  delete(): void;
}

  export declare class Handle_Geom_BSplineSurface_1 extends Handle_Geom_BSplineSurface {
    constructor();
  }

  export declare class Handle_Geom_BSplineSurface_2 extends Handle_Geom_BSplineSurface {
    constructor(thePtr: Geom_BSplineSurface);
  }

  export declare class Handle_Geom_BSplineSurface_3 extends Handle_Geom_BSplineSurface {
    constructor(theHandle: Handle_Geom_BSplineSurface);
  }

  export declare class Handle_Geom_BSplineSurface_4 extends Handle_Geom_BSplineSurface {
    constructor(theHandle: Handle_Geom_BSplineSurface);
  }

export declare class Geom_BSplineSurface extends Geom_BoundedSurface {
  ExchangeUV(): void;
  SetUPeriodic(): void;
  SetVPeriodic(): void;
  PeriodicNormalization(U: Standard_Real, V: Standard_Real): void;
  SetUOrigin(Index: Graphic3d_ZLayerId): void;
  SetVOrigin(Index: Graphic3d_ZLayerId): void;
  SetUNotPeriodic(): void;
  SetVNotPeriodic(): void;
  UReverse(): void;
  VReverse(): void;
  UReversedParameter(U: Standard_Real): Standard_Real;
  VReversedParameter(V: Standard_Real): Standard_Real;
  IncreaseDegree(UDegree: Graphic3d_ZLayerId, VDegree: Graphic3d_ZLayerId): void;
  InsertUKnots(Knots: IntTools_CArray1OfReal, Mults: TColStd_Array1OfInteger, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  InsertVKnots(Knots: IntTools_CArray1OfReal, Mults: TColStd_Array1OfInteger, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  RemoveUKnot(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId, Tolerance: Standard_Real): Standard_Boolean;
  RemoveVKnot(Index: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId, Tolerance: Standard_Real): Standard_Boolean;
  IncreaseUMultiplicity_1(UIndex: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncreaseUMultiplicity_2(FromI1: Graphic3d_ZLayerId, ToI2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncrementUMultiplicity(FromI1: Graphic3d_ZLayerId, ToI2: Graphic3d_ZLayerId, Step: Graphic3d_ZLayerId): void;
  IncreaseVMultiplicity_1(VIndex: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncreaseVMultiplicity_2(FromI1: Graphic3d_ZLayerId, ToI2: Graphic3d_ZLayerId, M: Graphic3d_ZLayerId): void;
  IncrementVMultiplicity(FromI1: Graphic3d_ZLayerId, ToI2: Graphic3d_ZLayerId, Step: Graphic3d_ZLayerId): void;
  InsertUKnot(U: Standard_Real, M: Graphic3d_ZLayerId, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  InsertVKnot(V: Standard_Real, M: Graphic3d_ZLayerId, ParametricTolerance: Standard_Real, Add: Standard_Boolean): void;
  Segment(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real, theUTolerance: Standard_Real, theVTolerance: Standard_Real): void;
  CheckAndSegment(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real, theUTolerance: Standard_Real, theVTolerance: Standard_Real): void;
  SetUKnot_1(UIndex: Graphic3d_ZLayerId, K: Standard_Real): void;
  SetUKnots(UK: IntTools_CArray1OfReal): void;
  SetUKnot_2(UIndex: Graphic3d_ZLayerId, K: Standard_Real, M: Graphic3d_ZLayerId): void;
  SetVKnot_1(VIndex: Graphic3d_ZLayerId, K: Standard_Real): void;
  SetVKnots(VK: IntTools_CArray1OfReal): void;
  SetVKnot_2(VIndex: Graphic3d_ZLayerId, K: Standard_Real, M: Graphic3d_ZLayerId): void;
  LocateU(U: Standard_Real, ParametricTolerance: Standard_Real, I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, WithKnotRepetition: Standard_Boolean): void;
  LocateV(V: Standard_Real, ParametricTolerance: Standard_Real, I1: Graphic3d_ZLayerId, I2: Graphic3d_ZLayerId, WithKnotRepetition: Standard_Boolean): void;
  SetPole_1(UIndex: Graphic3d_ZLayerId, VIndex: Graphic3d_ZLayerId, P: gp_Pnt): void;
  SetPole_2(UIndex: Graphic3d_ZLayerId, VIndex: Graphic3d_ZLayerId, P: gp_Pnt, Weight: Standard_Real): void;
  SetPoleCol_1(VIndex: Graphic3d_ZLayerId, CPoles: TColgp_Array1OfPnt): void;
  SetPoleCol_2(VIndex: Graphic3d_ZLayerId, CPoles: TColgp_Array1OfPnt, CPoleWeights: IntTools_CArray1OfReal): void;
  SetPoleRow_1(UIndex: Graphic3d_ZLayerId, CPoles: TColgp_Array1OfPnt, CPoleWeights: IntTools_CArray1OfReal): void;
  SetPoleRow_2(UIndex: Graphic3d_ZLayerId, CPoles: TColgp_Array1OfPnt): void;
  SetWeight(UIndex: Graphic3d_ZLayerId, VIndex: Graphic3d_ZLayerId, Weight: Standard_Real): void;
  SetWeightCol(VIndex: Graphic3d_ZLayerId, CPoleWeights: IntTools_CArray1OfReal): void;
  SetWeightRow(UIndex: Graphic3d_ZLayerId, CPoleWeights: IntTools_CArray1OfReal): void;
  MovePoint(U: Standard_Real, V: Standard_Real, P: gp_Pnt, UIndex1: Graphic3d_ZLayerId, UIndex2: Graphic3d_ZLayerId, VIndex1: Graphic3d_ZLayerId, VIndex2: Graphic3d_ZLayerId, UFirstIndex: Graphic3d_ZLayerId, ULastIndex: Graphic3d_ZLayerId, VFirstIndex: Graphic3d_ZLayerId, VLastIndex: Graphic3d_ZLayerId): void;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsCNu(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsCNv(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  IsURational(): Standard_Boolean;
  IsVPeriodic(): Standard_Boolean;
  IsVRational(): Standard_Boolean;
  Bounds(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  Continuity(): GeomAbs_Shape;
  FirstUKnotIndex(): Graphic3d_ZLayerId;
  FirstVKnotIndex(): Graphic3d_ZLayerId;
  LastUKnotIndex(): Graphic3d_ZLayerId;
  LastVKnotIndex(): Graphic3d_ZLayerId;
  NbUKnots(): Graphic3d_ZLayerId;
  NbUPoles(): Graphic3d_ZLayerId;
  NbVKnots(): Graphic3d_ZLayerId;
  NbVPoles(): Graphic3d_ZLayerId;
  Pole(UIndex: Graphic3d_ZLayerId, VIndex: Graphic3d_ZLayerId): gp_Pnt;
  Poles_1(P: TColgp_Array2OfPnt): void;
  Poles_2(): TColgp_Array2OfPnt;
  UDegree(): Graphic3d_ZLayerId;
  UKnot(UIndex: Graphic3d_ZLayerId): Standard_Real;
  UKnotDistribution(): GeomAbs_BSplKnotDistribution;
  UKnots_1(Ku: IntTools_CArray1OfReal): void;
  UKnots_2(): IntTools_CArray1OfReal;
  UKnotSequence_1(Ku: IntTools_CArray1OfReal): void;
  UKnotSequence_2(): IntTools_CArray1OfReal;
  UMultiplicity(UIndex: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  UMultiplicities_1(Mu: TColStd_Array1OfInteger): void;
  UMultiplicities_2(): TColStd_Array1OfInteger;
  VDegree(): Graphic3d_ZLayerId;
  VKnot(VIndex: Graphic3d_ZLayerId): Standard_Real;
  VKnotDistribution(): GeomAbs_BSplKnotDistribution;
  VKnots_1(Kv: IntTools_CArray1OfReal): void;
  VKnots_2(): IntTools_CArray1OfReal;
  VKnotSequence_1(Kv: IntTools_CArray1OfReal): void;
  VKnotSequence_2(): IntTools_CArray1OfReal;
  VMultiplicity(VIndex: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  VMultiplicities_1(Mv: TColStd_Array1OfInteger): void;
  VMultiplicities_2(): TColStd_Array1OfInteger;
  Weight(UIndex: Graphic3d_ZLayerId, VIndex: Graphic3d_ZLayerId): Standard_Real;
  Weights_1(W: TColStd_Array2OfReal): void;
  Weights_2(): TColStd_Array2OfReal;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  LocalD0(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId, P: gp_Pnt): void;
  LocalD1(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  LocalD2(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  LocalD3(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  LocalDN(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  LocalValue(U: Standard_Real, V: Standard_Real, FromUK1: Graphic3d_ZLayerId, ToUK2: Graphic3d_ZLayerId, FromVK1: Graphic3d_ZLayerId, ToVK2: Graphic3d_ZLayerId): gp_Pnt;
  UIso_1(U: Standard_Real): Handle_Geom_Curve;
  VIso_1(V: Standard_Real): Handle_Geom_Curve;
  UIso_2(U: Standard_Real, CheckRational: Standard_Boolean): Handle_Geom_Curve;
  VIso_2(V: Standard_Real, CheckRational: Standard_Boolean): Handle_Geom_Curve;
  Transform(T: gp_Trsf): void;
  static MaxDegree(): Graphic3d_ZLayerId;
  Resolution(Tolerance3D: Standard_Real, UTolerance: Standard_Real, VTolerance: Standard_Real): void;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom_BSplineSurface_1 extends Geom_BSplineSurface {
    constructor(Poles: TColgp_Array2OfPnt, UKnots: IntTools_CArray1OfReal, VKnots: IntTools_CArray1OfReal, UMults: TColStd_Array1OfInteger, VMults: TColStd_Array1OfInteger, UDegree: Graphic3d_ZLayerId, VDegree: Graphic3d_ZLayerId, UPeriodic: Standard_Boolean, VPeriodic: Standard_Boolean);
  }

  export declare class Geom_BSplineSurface_2 extends Geom_BSplineSurface {
    constructor(Poles: TColgp_Array2OfPnt, Weights: TColStd_Array2OfReal, UKnots: IntTools_CArray1OfReal, VKnots: IntTools_CArray1OfReal, UMults: TColStd_Array1OfInteger, VMults: TColStd_Array1OfInteger, UDegree: Graphic3d_ZLayerId, VDegree: Graphic3d_ZLayerId, UPeriodic: Standard_Boolean, VPeriodic: Standard_Boolean);
  }

export declare class Geom_Curve extends Geom_Geometry {
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  TransformedParameter(U: Standard_Real, T: gp_Trsf): Standard_Real;
  ParametricTransformation(T: gp_Trsf): Standard_Real;
  Reversed(): Handle_Geom_Curve;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  IsClosed(): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  Period(): Standard_Real;
  Continuity(): GeomAbs_Shape;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V1: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  Value(U: Standard_Real): gp_Pnt;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Handle_Geom_Curve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_Curve): void;
  get(): Geom_Curve;
  delete(): void;
}

  export declare class Handle_Geom_Curve_1 extends Handle_Geom_Curve {
    constructor();
  }

  export declare class Handle_Geom_Curve_2 extends Handle_Geom_Curve {
    constructor(thePtr: Geom_Curve);
  }

  export declare class Handle_Geom_Curve_3 extends Handle_Geom_Curve {
    constructor(theHandle: Handle_Geom_Curve);
  }

  export declare class Handle_Geom_Curve_4 extends Handle_Geom_Curve {
    constructor(theHandle: Handle_Geom_Curve);
  }

export declare class Geom_ConicalSurface extends Geom_ElementarySurface {
  SetCone(C: gp_Cone): void;
  SetRadius(R: Standard_Real): void;
  SetSemiAngle(Ang: Standard_Real): void;
  Cone(): gp_Cone;
  UReversedParameter(U: Standard_Real): Standard_Real;
  VReversedParameter(V: Standard_Real): Standard_Real;
  VReverse(): void;
  TransformParameters(U: Standard_Real, V: Standard_Real, T: gp_Trsf): void;
  ParametricTransformation(T: gp_Trsf): gp_GTrsf2d;
  Apex(): gp_Pnt;
  Bounds(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  Coefficients(A1: Standard_Real, A2: Standard_Real, A3: Standard_Real, B1: Standard_Real, B2: Standard_Real, B3: Standard_Real, C1: Standard_Real, C2: Standard_Real, C3: Standard_Real, D: Standard_Real): void;
  RefRadius(): Standard_Real;
  SemiAngle(): Standard_Real;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  IsVPeriodic(): Standard_Boolean;
  UIso(U: Standard_Real): Handle_Geom_Curve;
  VIso(V: Standard_Real): Handle_Geom_Curve;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  Transform(T: gp_Trsf): void;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom_ConicalSurface_1 extends Geom_ConicalSurface {
    constructor(A3: gp_Ax3, Ang: Standard_Real, Radius: Standard_Real);
  }

  export declare class Geom_ConicalSurface_2 extends Geom_ConicalSurface {
    constructor(C: gp_Cone);
  }

export declare class Geom_CylindricalSurface extends Geom_ElementarySurface {
  SetCylinder(C: gp_Cylinder): void;
  SetRadius(R: Standard_Real): void;
  Cylinder(): gp_Cylinder;
  UReversedParameter(U: Standard_Real): Standard_Real;
  VReversedParameter(V: Standard_Real): Standard_Real;
  TransformParameters(U: Standard_Real, V: Standard_Real, T: gp_Trsf): void;
  ParametricTransformation(T: gp_Trsf): gp_GTrsf2d;
  Bounds(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  Coefficients(A1: Standard_Real, A2: Standard_Real, A3: Standard_Real, B1: Standard_Real, B2: Standard_Real, B3: Standard_Real, C1: Standard_Real, C2: Standard_Real, C3: Standard_Real, D: Standard_Real): void;
  Radius(): Standard_Real;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  IsVPeriodic(): Standard_Boolean;
  UIso(U: Standard_Real): Handle_Geom_Curve;
  VIso(V: Standard_Real): Handle_Geom_Curve;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  Transform(T: gp_Trsf): void;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom_CylindricalSurface_1 extends Geom_CylindricalSurface {
    constructor(A3: gp_Ax3, Radius: Standard_Real);
  }

  export declare class Geom_CylindricalSurface_2 extends Geom_CylindricalSurface {
    constructor(C: gp_Cylinder);
  }

export declare class Handle_Geom_Surface {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_Surface): void;
  get(): Geom_Surface;
  delete(): void;
}

  export declare class Handle_Geom_Surface_1 extends Handle_Geom_Surface {
    constructor();
  }

  export declare class Handle_Geom_Surface_2 extends Handle_Geom_Surface {
    constructor(thePtr: Geom_Surface);
  }

  export declare class Handle_Geom_Surface_3 extends Handle_Geom_Surface {
    constructor(theHandle: Handle_Geom_Surface);
  }

  export declare class Handle_Geom_Surface_4 extends Handle_Geom_Surface {
    constructor(theHandle: Handle_Geom_Surface);
  }

export declare class Geom_Surface extends Geom_Geometry {
  UReverse(): void;
  UReversed(): Handle_Geom_Surface;
  UReversedParameter(U: Standard_Real): Standard_Real;
  VReverse(): void;
  VReversed(): Handle_Geom_Surface;
  VReversedParameter(V: Standard_Real): Standard_Real;
  TransformParameters(U: Standard_Real, V: Standard_Real, T: gp_Trsf): void;
  ParametricTransformation(T: gp_Trsf): gp_GTrsf2d;
  Bounds(U1: Standard_Real, U2: Standard_Real, V1: Standard_Real, V2: Standard_Real): void;
  IsUClosed(): Standard_Boolean;
  IsVClosed(): Standard_Boolean;
  IsUPeriodic(): Standard_Boolean;
  UPeriod(): Standard_Real;
  IsVPeriodic(): Standard_Boolean;
  VPeriod(): Standard_Real;
  UIso(U: Standard_Real): Handle_Geom_Curve;
  VIso(V: Standard_Real): Handle_Geom_Curve;
  Continuity(): GeomAbs_Shape;
  IsCNu(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsCNv(N: Graphic3d_ZLayerId): Standard_Boolean;
  D0(U: Standard_Real, V: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec): void;
  D2(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec): void;
  D3(U: Standard_Real, V: Standard_Real, P: gp_Pnt, D1U: gp_Vec, D1V: gp_Vec, D2U: gp_Vec, D2V: gp_Vec, D2UV: gp_Vec, D3U: gp_Vec, D3V: gp_Vec, D3UUV: gp_Vec, D3UVV: gp_Vec): void;
  DN(U: Standard_Real, V: Standard_Real, Nu: Graphic3d_ZLayerId, Nv: Graphic3d_ZLayerId): gp_Vec;
  Value(U: Standard_Real, V: Standard_Real): gp_Pnt;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom_Geometry extends Standard_Transient {
  Mirror_1(P: gp_Pnt): void;
  Mirror_2(A1: gp_Ax1): void;
  Mirror_3(A2: gp_Ax2): void;
  Rotate(A1: gp_Ax1, Ang: Standard_Real): void;
  Scale(P: gp_Pnt, S: Standard_Real): void;
  Translate_1(V: gp_Vec): void;
  Translate_2(P1: gp_Pnt, P2: gp_Pnt): void;
  Transform(T: gp_Trsf): void;
  Mirrored_1(P: gp_Pnt): Handle_Geom_Geometry;
  Mirrored_2(A1: gp_Ax1): Handle_Geom_Geometry;
  Mirrored_3(A2: gp_Ax2): Handle_Geom_Geometry;
  Rotated(A1: gp_Ax1, Ang: Standard_Real): Handle_Geom_Geometry;
  Scaled(P: gp_Pnt, S: Standard_Real): Handle_Geom_Geometry;
  Transformed(T: gp_Trsf): Handle_Geom_Geometry;
  Translated_1(V: gp_Vec): Handle_Geom_Geometry;
  Translated_2(P1: gp_Pnt, P2: gp_Pnt): Handle_Geom_Geometry;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class Geom_BezierCurve extends Geom_BoundedCurve {
  Increase(Degree: Graphic3d_ZLayerId): void;
  InsertPoleAfter_1(Index: Graphic3d_ZLayerId, P: gp_Pnt): void;
  InsertPoleAfter_2(Index: Graphic3d_ZLayerId, P: gp_Pnt, Weight: Standard_Real): void;
  InsertPoleBefore_1(Index: Graphic3d_ZLayerId, P: gp_Pnt): void;
  InsertPoleBefore_2(Index: Graphic3d_ZLayerId, P: gp_Pnt, Weight: Standard_Real): void;
  RemovePole(Index: Graphic3d_ZLayerId): void;
  Reverse(): void;
  ReversedParameter(U: Standard_Real): Standard_Real;
  Segment(U1: Standard_Real, U2: Standard_Real): void;
  SetPole_1(Index: Graphic3d_ZLayerId, P: gp_Pnt): void;
  SetPole_2(Index: Graphic3d_ZLayerId, P: gp_Pnt, Weight: Standard_Real): void;
  SetWeight(Index: Graphic3d_ZLayerId, Weight: Standard_Real): void;
  IsClosed(): Standard_Boolean;
  IsCN(N: Graphic3d_ZLayerId): Standard_Boolean;
  IsPeriodic(): Standard_Boolean;
  IsRational(): Standard_Boolean;
  Continuity(): GeomAbs_Shape;
  Degree(): Graphic3d_ZLayerId;
  D0(U: Standard_Real, P: gp_Pnt): void;
  D1(U: Standard_Real, P: gp_Pnt, V1: gp_Vec): void;
  D2(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec): void;
  D3(U: Standard_Real, P: gp_Pnt, V1: gp_Vec, V2: gp_Vec, V3: gp_Vec): void;
  DN(U: Standard_Real, N: Graphic3d_ZLayerId): gp_Vec;
  StartPoint(): gp_Pnt;
  EndPoint(): gp_Pnt;
  FirstParameter(): Standard_Real;
  LastParameter(): Standard_Real;
  NbPoles(): Graphic3d_ZLayerId;
  Pole(Index: Graphic3d_ZLayerId): gp_Pnt;
  Poles_1(P: TColgp_Array1OfPnt): void;
  Poles_2(): TColgp_Array1OfPnt;
  Weight(Index: Graphic3d_ZLayerId): Standard_Real;
  Weights_1(W: IntTools_CArray1OfReal): void;
  Weights_2(): IntTools_CArray1OfReal;
  Transform(T: gp_Trsf): void;
  static MaxDegree(): Graphic3d_ZLayerId;
  Resolution(Tolerance3D: Standard_Real, UTolerance: Standard_Real): void;
  Copy(): Handle_Geom_Geometry;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class Geom_BezierCurve_1 extends Geom_BezierCurve {
    constructor(CurvePoles: TColgp_Array1OfPnt);
  }

  export declare class Geom_BezierCurve_2 extends Geom_BezierCurve {
    constructor(CurvePoles: TColgp_Array1OfPnt, PoleWeights: IntTools_CArray1OfReal);
  }

export declare class Handle_Geom_BezierCurve {
  Nullify(): void;
  IsNull(): boolean;
  reset(thePtr: Geom_BezierCurve): void;
  get(): Geom_BezierCurve;
  delete(): void;
}

  export declare class Handle_Geom_BezierCurve_1 extends Handle_Geom_BezierCurve {
    constructor();
  }

  export declare class Handle_Geom_BezierCurve_2 extends Handle_Geom_BezierCurve {
    constructor(thePtr: Geom_BezierCurve);
  }

  export declare class Handle_Geom_BezierCurve_3 extends Handle_Geom_BezierCurve {
    constructor(theHandle: Handle_Geom_BezierCurve);
  }

  export declare class Handle_Geom_BezierCurve_4 extends Handle_Geom_BezierCurve {
    constructor(theHandle: Handle_Geom_BezierCurve);
  }

export declare class Geom_BoundedSurface extends Geom_Surface {
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class BRepFilletAPI_MakeFillet extends BRepFilletAPI_LocalOperation {
  constructor(S: TopoDS_Shape, FShape: ChFi3d_FilletShape)
  SetParams(Tang: Standard_Real, Tesp: Standard_Real, T2d: Standard_Real, TApp3d: Standard_Real, TolApp2d: Standard_Real, Fleche: Standard_Real): void;
  SetContinuity(InternalContinuity: GeomAbs_Shape, AngularTolerance: Standard_Real): void;
  Add_1(E: TopoDS_Edge): void;
  Add_2(Radius: Standard_Real, E: TopoDS_Edge): void;
  Add_3(R1: Standard_Real, R2: Standard_Real, E: TopoDS_Edge): void;
  Add_4(L: Handle_Law_Function, E: TopoDS_Edge): void;
  Add_5(UandR: TColgp_Array1OfPnt2d, E: TopoDS_Edge): void;
  SetRadius_1(Radius: Standard_Real, IC: Graphic3d_ZLayerId, IinC: Graphic3d_ZLayerId): void;
  SetRadius_2(R1: Standard_Real, R2: Standard_Real, IC: Graphic3d_ZLayerId, IinC: Graphic3d_ZLayerId): void;
  SetRadius_3(L: Handle_Law_Function, IC: Graphic3d_ZLayerId, IinC: Graphic3d_ZLayerId): void;
  SetRadius_4(UandR: TColgp_Array1OfPnt2d, IC: Graphic3d_ZLayerId, IinC: Graphic3d_ZLayerId): void;
  ResetContour(IC: Graphic3d_ZLayerId): void;
  IsConstant_1(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Radius_1(IC: Graphic3d_ZLayerId): Standard_Real;
  IsConstant_2(IC: Graphic3d_ZLayerId, E: TopoDS_Edge): Standard_Boolean;
  Radius_2(IC: Graphic3d_ZLayerId, E: TopoDS_Edge): Standard_Real;
  SetRadius_5(Radius: Standard_Real, IC: Graphic3d_ZLayerId, E: TopoDS_Edge): void;
  SetRadius_6(Radius: Standard_Real, IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): void;
  GetBounds(IC: Graphic3d_ZLayerId, E: TopoDS_Edge, F: Standard_Real, L: Standard_Real): Standard_Boolean;
  GetLaw(IC: Graphic3d_ZLayerId, E: TopoDS_Edge): Handle_Law_Function;
  SetLaw(IC: Graphic3d_ZLayerId, E: TopoDS_Edge, L: Handle_Law_Function): void;
  SetFilletShape(FShape: ChFi3d_FilletShape): void;
  GetFilletShape(): ChFi3d_FilletShape;
  NbContours(): Graphic3d_ZLayerId;
  Contour(E: TopoDS_Edge): Graphic3d_ZLayerId;
  NbEdges(I: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Edge(I: Graphic3d_ZLayerId, J: Graphic3d_ZLayerId): TopoDS_Edge;
  Remove(E: TopoDS_Edge): void;
  Length(IC: Graphic3d_ZLayerId): Standard_Real;
  FirstVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  LastVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  Abscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  RelativeAbscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  ClosedAndTangent(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Closed(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Build(theRange: Message_ProgressRange): void;
  Reset(): void;
  Builder(): Handle_TopOpeBRepBuild_HBuilder;
  Generated(EorV: TopoDS_Shape): TopTools_ListOfShape;
  Modified(F: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(F: TopoDS_Shape): Standard_Boolean;
  NbSurfaces(): Graphic3d_ZLayerId;
  NewFaces(I: Graphic3d_ZLayerId): TopTools_ListOfShape;
  Simulate(IC: Graphic3d_ZLayerId): void;
  NbSurf(IC: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Sect(IC: Graphic3d_ZLayerId, IS: Graphic3d_ZLayerId): Handle_ChFiDS_SecHArray1;
  NbFaultyContours(): Graphic3d_ZLayerId;
  FaultyContour(I: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  NbComputedSurfaces(IC: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  ComputedSurface(IC: Graphic3d_ZLayerId, IS: Graphic3d_ZLayerId): Handle_Geom_Surface;
  NbFaultyVertices(): Graphic3d_ZLayerId;
  FaultyVertex(IV: Graphic3d_ZLayerId): TopoDS_Vertex;
  HasResult(): Standard_Boolean;
  BadShape(): TopoDS_Shape;
  StripeStatus(IC: Graphic3d_ZLayerId): ChFiDS_ErrorStatus;
  delete(): void;
}

export declare class BRepFilletAPI_LocalOperation extends BRepBuilderAPI_MakeShape {
  Add(E: TopoDS_Edge): void;
  ResetContour(IC: Graphic3d_ZLayerId): void;
  NbContours(): Graphic3d_ZLayerId;
  Contour(E: TopoDS_Edge): Graphic3d_ZLayerId;
  NbEdges(I: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Edge(I: Graphic3d_ZLayerId, J: Graphic3d_ZLayerId): TopoDS_Edge;
  Remove(E: TopoDS_Edge): void;
  Length(IC: Graphic3d_ZLayerId): Standard_Real;
  FirstVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  LastVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  Abscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  RelativeAbscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  ClosedAndTangent(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Closed(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Reset(): void;
  Simulate(IC: Graphic3d_ZLayerId): void;
  NbSurf(IC: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Sect(IC: Graphic3d_ZLayerId, IS: Graphic3d_ZLayerId): Handle_ChFiDS_SecHArray1;
  delete(): void;
}

export declare class BRepFilletAPI_MakeChamfer extends BRepFilletAPI_LocalOperation {
  constructor(S: TopoDS_Shape)
  Add_1(E: TopoDS_Edge): void;
  Add_2(Dis: Standard_Real, E: TopoDS_Edge): void;
  SetDist(Dis: Standard_Real, IC: Graphic3d_ZLayerId, F: TopoDS_Face): void;
  GetDist(IC: Graphic3d_ZLayerId, Dis: Standard_Real): void;
  Add_3(Dis1: Standard_Real, Dis2: Standard_Real, E: TopoDS_Edge, F: TopoDS_Face): void;
  SetDists(Dis1: Standard_Real, Dis2: Standard_Real, IC: Graphic3d_ZLayerId, F: TopoDS_Face): void;
  Dists(IC: Graphic3d_ZLayerId, Dis1: Standard_Real, Dis2: Standard_Real): void;
  AddDA(Dis: Standard_Real, Angle: Standard_Real, E: TopoDS_Edge, F: TopoDS_Face): void;
  SetDistAngle(Dis: Standard_Real, Angle: Standard_Real, IC: Graphic3d_ZLayerId, F: TopoDS_Face): void;
  GetDistAngle(IC: Graphic3d_ZLayerId, Dis: Standard_Real, Angle: Standard_Real): void;
  SetMode(theMode: ChFiDS_ChamfMode): void;
  IsSymetric(IC: Graphic3d_ZLayerId): Standard_Boolean;
  IsTwoDistances(IC: Graphic3d_ZLayerId): Standard_Boolean;
  IsDistanceAngle(IC: Graphic3d_ZLayerId): Standard_Boolean;
  ResetContour(IC: Graphic3d_ZLayerId): void;
  NbContours(): Graphic3d_ZLayerId;
  Contour(E: TopoDS_Edge): Graphic3d_ZLayerId;
  NbEdges(I: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Edge(I: Graphic3d_ZLayerId, J: Graphic3d_ZLayerId): TopoDS_Edge;
  Remove(E: TopoDS_Edge): void;
  Length(IC: Graphic3d_ZLayerId): Standard_Real;
  FirstVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  LastVertex(IC: Graphic3d_ZLayerId): TopoDS_Vertex;
  Abscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  RelativeAbscissa(IC: Graphic3d_ZLayerId, V: TopoDS_Vertex): Standard_Real;
  ClosedAndTangent(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Closed(IC: Graphic3d_ZLayerId): Standard_Boolean;
  Build(theRange: Message_ProgressRange): void;
  Reset(): void;
  Builder(): Handle_TopOpeBRepBuild_HBuilder;
  Generated(EorV: TopoDS_Shape): TopTools_ListOfShape;
  Modified(F: TopoDS_Shape): TopTools_ListOfShape;
  IsDeleted(F: TopoDS_Shape): Standard_Boolean;
  Simulate(IC: Graphic3d_ZLayerId): void;
  NbSurf(IC: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  Sect(IC: Graphic3d_ZLayerId, IS: Graphic3d_ZLayerId): Handle_ChFiDS_SecHArray1;
  delete(): void;
}

export declare class TopoDS_CompSolid extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS {
  constructor();
  static Vertex_1(S: TopoDS_Shape): TopoDS_Vertex;
  static Vertex_2(a0: TopoDS_Shape): TopoDS_Vertex;
  static Edge_1(S: TopoDS_Shape): TopoDS_Edge;
  static Edge_2(a0: TopoDS_Shape): TopoDS_Edge;
  static Wire_1(S: TopoDS_Shape): TopoDS_Wire;
  static Wire_2(a0: TopoDS_Shape): TopoDS_Wire;
  static Face_1(S: TopoDS_Shape): TopoDS_Face;
  static Face_2(a0: TopoDS_Shape): TopoDS_Face;
  static Shell_1(S: TopoDS_Shape): TopoDS_Shell;
  static Shell_2(a0: TopoDS_Shape): TopoDS_Shell;
  static Solid_1(S: TopoDS_Shape): TopoDS_Solid;
  static Solid_2(a0: TopoDS_Shape): TopoDS_Solid;
  static CompSolid_1(S: TopoDS_Shape): TopoDS_CompSolid;
  static CompSolid_2(a0: TopoDS_Shape): TopoDS_CompSolid;
  static Compound_1(S: TopoDS_Shape): TopoDS_Compound;
  static Compound_2(a0: TopoDS_Shape): TopoDS_Compound;
  delete(): void;
}

export declare class TopoDS_Vertex extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Builder {
  constructor();
  MakeWire(W: TopoDS_Wire): void;
  MakeShell(S: TopoDS_Shell): void;
  MakeSolid(S: TopoDS_Solid): void;
  MakeCompSolid(C: TopoDS_CompSolid): void;
  MakeCompound(C: TopoDS_Compound): void;
  Add(S: TopoDS_Shape, C: TopoDS_Shape): void;
  Remove(S: TopoDS_Shape, C: TopoDS_Shape): void;
  delete(): void;
}

export declare class TopoDS_Shape {
  constructor()
  IsNull(): Standard_Boolean;
  Nullify(): void;
  Location_1(): TopLoc_Location;
  Location_2(theLoc: TopLoc_Location, theRaiseExc: Standard_Boolean): void;
  Located(theLoc: TopLoc_Location, theRaiseExc: Standard_Boolean): TopoDS_Shape;
  Orientation_1(): TopAbs_Orientation;
  Orientation_2(theOrient: TopAbs_Orientation): void;
  Oriented(theOrient: TopAbs_Orientation): TopoDS_Shape;
  TShape_1(): Handle_TopoDS_TShape;
  ShapeType(): TopAbs_ShapeEnum;
  Free_1(): Standard_Boolean;
  Free_2(theIsFree: Standard_Boolean): void;
  Locked_1(): Standard_Boolean;
  Locked_2(theIsLocked: Standard_Boolean): void;
  Modified_1(): Standard_Boolean;
  Modified_2(theIsModified: Standard_Boolean): void;
  Checked_1(): Standard_Boolean;
  Checked_2(theIsChecked: Standard_Boolean): void;
  Orientable_1(): Standard_Boolean;
  Orientable_2(theIsOrientable: Standard_Boolean): void;
  Closed_1(): Standard_Boolean;
  Closed_2(theIsClosed: Standard_Boolean): void;
  Infinite_1(): Standard_Boolean;
  Infinite_2(theIsInfinite: Standard_Boolean): void;
  Convex_1(): Standard_Boolean;
  Convex_2(theIsConvex: Standard_Boolean): void;
  Move(thePosition: TopLoc_Location, theRaiseExc: Standard_Boolean): void;
  Moved(thePosition: TopLoc_Location, theRaiseExc: Standard_Boolean): TopoDS_Shape;
  Reverse(): void;
  Reversed(): TopoDS_Shape;
  Complement(): void;
  Complemented(): TopoDS_Shape;
  Compose(theOrient: TopAbs_Orientation): void;
  Composed(theOrient: TopAbs_Orientation): TopoDS_Shape;
  NbChildren(): Graphic3d_ZLayerId;
  IsPartner(theOther: TopoDS_Shape): Standard_Boolean;
  IsSame(theOther: TopoDS_Shape): Standard_Boolean;
  IsEqual(theOther: TopoDS_Shape): Standard_Boolean;
  IsNotEqual(theOther: TopoDS_Shape): Standard_Boolean;
  HashCode(theUpperBound: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  EmptyCopy(): void;
  EmptyCopied(): TopoDS_Shape;
  TShape_2(theTShape: Handle_TopoDS_TShape): void;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  delete(): void;
}

export declare class TopoDS_Wire extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Shell extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Edge extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Face extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Iterator {
  Initialize(S: TopoDS_Shape, cumOri: Standard_Boolean, cumLoc: Standard_Boolean): void;
  More(): Standard_Boolean;
  Next(): void;
  Value(): TopoDS_Shape;
  delete(): void;
}

  export declare class TopoDS_Iterator_1 extends TopoDS_Iterator {
    constructor();
  }

  export declare class TopoDS_Iterator_2 extends TopoDS_Iterator {
    constructor(S: TopoDS_Shape, cumOri: Standard_Boolean, cumLoc: Standard_Boolean);
  }

export declare class TopoDS_Solid extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class TopoDS_Compound extends TopoDS_Shape {
  constructor()
  delete(): void;
}

export declare class BRepMesh_DiscretRoot extends Standard_Transient {
  SetShape(theShape: TopoDS_Shape): void;
  Shape(): TopoDS_Shape;
  IsDone(): Standard_Boolean;
  Perform(theRange: Message_ProgressRange): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

export declare class BRepMesh_IncrementalMesh extends BRepMesh_DiscretRoot {
  Perform_1(theRange: Message_ProgressRange): void;
  Perform_2(theContext: any, theRange: Message_ProgressRange): void;
  Parameters(): IMeshTools_Parameters;
  ChangeParameters(): IMeshTools_Parameters;
  IsModified(): Standard_Boolean;
  GetStatusFlags(): Graphic3d_ZLayerId;
  static Discret(theShape: TopoDS_Shape, theLinDeflection: Standard_Real, theAngDeflection: Standard_Real, theAlgo: BRepMesh_DiscretRoot): Graphic3d_ZLayerId;
  static IsParallelDefault(): Standard_Boolean;
  static SetParallelDefault(isInParallel: Standard_Boolean): void;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class BRepMesh_IncrementalMesh_1 extends BRepMesh_IncrementalMesh {
    constructor();
  }

  export declare class BRepMesh_IncrementalMesh_2 extends BRepMesh_IncrementalMesh {
    constructor(theShape: TopoDS_Shape, theLinDeflection: Standard_Real, isRelative: Standard_Boolean, theAngDeflection: Standard_Real, isInParallel: Standard_Boolean);
  }

  export declare class BRepMesh_IncrementalMesh_3 extends BRepMesh_IncrementalMesh {
    constructor(theShape: TopoDS_Shape, theParameters: IMeshTools_Parameters, theRange: Message_ProgressRange);
  }

export declare class TopLoc_Location {
  IsIdentity(): Standard_Boolean;
  Identity(): void;
  FirstDatum(): Handle_TopLoc_Datum3D;
  FirstPower(): Graphic3d_ZLayerId;
  NextLocation(): TopLoc_Location;
  Transformation(): gp_Trsf;
  Inverted(): TopLoc_Location;
  Multiplied(Other: TopLoc_Location): TopLoc_Location;
  Divided(Other: TopLoc_Location): TopLoc_Location;
  Predivided(Other: TopLoc_Location): TopLoc_Location;
  Powered(pwr: Graphic3d_ZLayerId): TopLoc_Location;
  HashCode(theUpperBound: Graphic3d_ZLayerId): Graphic3d_ZLayerId;
  IsEqual(Other: TopLoc_Location): Standard_Boolean;
  IsDifferent(Other: TopLoc_Location): Standard_Boolean;
  DumpJson(theOStream: Standard_OStream, theDepth: Graphic3d_ZLayerId): void;
  ShallowDump(S: Standard_OStream): void;
  Clear(): void;
  static ScalePrec(): Standard_Real;
  delete(): void;
}

  export declare class TopLoc_Location_1 extends TopLoc_Location {
    constructor();
  }

  export declare class TopLoc_Location_2 extends TopLoc_Location {
    constructor(T: gp_Trsf);
  }

  export declare class TopLoc_Location_3 extends TopLoc_Location {
    constructor(D: Handle_TopLoc_Datum3D);
  }

export declare class ShapeUpgrade_UnifySameDomain extends Standard_Transient {
  Initialize(aShape: TopoDS_Shape, UnifyEdges: Standard_Boolean, UnifyFaces: Standard_Boolean, ConcatBSplines: Standard_Boolean): void;
  AllowInternalEdges(theValue: Standard_Boolean): void;
  KeepShape(theShape: TopoDS_Shape): void;
  KeepShapes(theShapes: TopTools_MapOfShape): void;
  SetSafeInputMode(theValue: Standard_Boolean): void;
  SetLinearTolerance(theValue: Standard_Real): void;
  SetAngularTolerance(theValue: Standard_Real): void;
  Build(): void;
  Shape(): TopoDS_Shape;
  History_1(): Handle_BRepTools_History;
  History_2(): Handle_BRepTools_History;
  static get_type_name(): Standard_Character;
  static get_type_descriptor(): Handle_Standard_Type;
  DynamicType(): Handle_Standard_Type;
  delete(): void;
}

  export declare class ShapeUpgrade_UnifySameDomain_1 extends ShapeUpgrade_UnifySameDomain {
    constructor();
  }

  export declare class ShapeUpgrade_UnifySameDomain_2 extends ShapeUpgrade_UnifySameDomain {
    constructor(aShape: TopoDS_Shape, UnifyEdges: Standard_Boolean, UnifyFaces: Standard_Boolean, ConcatBSplines: Standard_Boolean);
  }

type Standard_Boolean = boolean;
type Standard_Byte = number;
type Standard_Character = number;
type Standard_CString = string;
type Standard_Integer = number;
type Standard_Real = number;
type Standard_ShortReal = number;
type Standard_Size = number;

declare namespace FS {
  interface Lookup {
      path: string;
      node: FSNode;
  }

  interface FSStream {}
  interface FSNode {}
  interface ErrnoError {}

  let ignorePermissions: boolean;
  let trackingDelegate: any;
  let tracking: any;
  let genericErrors: any;

  //
  // paths
  //
  function lookupPath(path: string, opts: any): Lookup;
  function getPath(node: FSNode): string;

  //
  // nodes
  //
  function isFile(mode: number): boolean;
  function isDir(mode: number): boolean;
  function isLink(mode: number): boolean;
  function isChrdev(mode: number): boolean;
  function isBlkdev(mode: number): boolean;
  function isFIFO(mode: number): boolean;
  function isSocket(mode: number): boolean;

  //
  // devices
  //
  function major(dev: number): number;
  function minor(dev: number): number;
  function makedev(ma: number, mi: number): number;
  function registerDevice(dev: number, ops: any): void;

  //
  // core
  //
  function syncfs(populate: boolean, callback: (e: any) => any): void;
  function syncfs(callback: (e: any) => any, populate?: boolean): void;
  function mount(type: any, opts: any, mountpoint: string): any;
  function unmount(mountpoint: string): void;

  function mkdir(path: string, mode?: number): any;
  function mkdev(path: string, mode?: number, dev?: number): any;
  function symlink(oldpath: string, newpath: string): any;
  function rename(old_path: string, new_path: string): void;
  function rmdir(path: string): void;
  function readdir(path: string): any;
  function unlink(path: string): void;
  function readlink(path: string): string;
  function stat(path: string, dontFollow?: boolean): any;
  function lstat(path: string): any;
  function chmod(path: string, mode: number, dontFollow?: boolean): void;
  function lchmod(path: string, mode: number): void;
  function fchmod(fd: number, mode: number): void;
  function chown(path: string, uid: number, gid: number, dontFollow?: boolean): void;
  function lchown(path: string, uid: number, gid: number): void;
  function fchown(fd: number, uid: number, gid: number): void;
  function truncate(path: string, len: number): void;
  function ftruncate(fd: number, len: number): void;
  function utime(path: string, atime: number, mtime: number): void;
  function open(path: string, flags: string, mode?: number, fd_start?: number, fd_end?: number): FSStream;
  function close(stream: FSStream): void;
  function llseek(stream: FSStream, offset: number, whence: number): any;
  function read(stream: FSStream, buffer: ArrayBufferView, offset: number, length: number, position?: number): number;
  function write(
      stream: FSStream,
      buffer: ArrayBufferView,
      offset: number,
      length: number,
      position?: number,
      canOwn?: boolean,
  ): number;
  function allocate(stream: FSStream, offset: number, length: number): void;
  function mmap(
      stream: FSStream,
      buffer: ArrayBufferView,
      offset: number,
      length: number,
      position: number,
      prot: number,
      flags: number,
  ): any;
  function ioctl(stream: FSStream, cmd: any, arg: any): any;
  function readFile(path: string, opts: { encoding: 'binary'; flags?: string }): Uint8Array;
  function readFile(path: string, opts: { encoding: 'utf8'; flags?: string }): string;
  function readFile(path: string, opts?: { flags?: string }): Uint8Array;
  function writeFile(path: string, data: string | ArrayBufferView, opts?: { flags?: string }): void;

  //
  // module-level FS code
  //
  function cwd(): string;
  function chdir(path: string): void;
  function init(
      input: null | (() => number | null),
      output: null | ((c: number) => any),
      error: null | ((c: number) => any),
  ): void;

  function createLazyFile(
      parent: string | FSNode,
      name: string,
      url: string,
      canRead: boolean,
      canWrite: boolean,
  ): FSNode;
  function createPreloadedFile(
      parent: string | FSNode,
      name: string,
      url: string,
      canRead: boolean,
      canWrite: boolean,
      onload?: () => void,
      onerror?: () => void,
      dontCreateFile?: boolean,
      canOwn?: boolean,
  ): void;
  function createDataFile(
      parent: string | FSNode,
      name: string,
      data: ArrayBufferView | string,
      canRead: boolean,
      canWrite: boolean,
      canOwn: boolean,
  ): FSNode;
  interface AnalysisResults {
    isRoot: boolean,
    exists: boolean,
    error: Error,
    name: string,
    path: any,
    object: any,
    parentExists: boolean,
    parentPath: any,
    parentObject: any
  }
  function analyzePath(path: string): AnalysisResults;
}


export type OpenCascadeInstance = {FS: typeof FS} & {
  BRepAdaptor_CompCurve: typeof BRepAdaptor_CompCurve;
  BRepAdaptor_CompCurve_1: typeof BRepAdaptor_CompCurve_1;
  BRepAdaptor_CompCurve_2: typeof BRepAdaptor_CompCurve_2;
  BRepAdaptor_CompCurve_3: typeof BRepAdaptor_CompCurve_3;
  BRepAdaptor_Curve: typeof BRepAdaptor_Curve;
  BRepAdaptor_Curve_1: typeof BRepAdaptor_Curve_1;
  BRepAdaptor_Curve_2: typeof BRepAdaptor_Curve_2;
  BRepAdaptor_Curve_3: typeof BRepAdaptor_Curve_3;
  BRepAdaptor_Surface: typeof BRepAdaptor_Surface;
  BRepAdaptor_Surface_1: typeof BRepAdaptor_Surface_1;
  BRepAdaptor_Surface_2: typeof BRepAdaptor_Surface_2;
  BRepBuilderAPI_MakeShape: typeof BRepBuilderAPI_MakeShape;
  BRepBuilderAPI_Transform: typeof BRepBuilderAPI_Transform;
  BRepBuilderAPI_Transform_1: typeof BRepBuilderAPI_Transform_1;
  BRepBuilderAPI_Transform_2: typeof BRepBuilderAPI_Transform_2;
  BRepBuilderAPI_ModifyShape: typeof BRepBuilderAPI_ModifyShape;
  BRepBuilderAPI_MakeSolid: typeof BRepBuilderAPI_MakeSolid;
  BRepBuilderAPI_MakeSolid_1: typeof BRepBuilderAPI_MakeSolid_1;
  BRepBuilderAPI_MakeSolid_2: typeof BRepBuilderAPI_MakeSolid_2;
  BRepBuilderAPI_MakeSolid_3: typeof BRepBuilderAPI_MakeSolid_3;
  BRepBuilderAPI_MakeSolid_4: typeof BRepBuilderAPI_MakeSolid_4;
  BRepBuilderAPI_MakeSolid_5: typeof BRepBuilderAPI_MakeSolid_5;
  BRepBuilderAPI_MakeSolid_6: typeof BRepBuilderAPI_MakeSolid_6;
  BRepBuilderAPI_MakeSolid_7: typeof BRepBuilderAPI_MakeSolid_7;
  BRepBuilderAPI_Sewing: typeof BRepBuilderAPI_Sewing;
  BRepBuilderAPI_TransitionMode: BRepBuilderAPI_TransitionMode;
  BRepBuilderAPI_MakeVertex: typeof BRepBuilderAPI_MakeVertex;
  BRepBuilderAPI_MakeFace: typeof BRepBuilderAPI_MakeFace;
  BRepBuilderAPI_MakeFace_1: typeof BRepBuilderAPI_MakeFace_1;
  BRepBuilderAPI_MakeFace_2: typeof BRepBuilderAPI_MakeFace_2;
  BRepBuilderAPI_MakeFace_3: typeof BRepBuilderAPI_MakeFace_3;
  BRepBuilderAPI_MakeFace_4: typeof BRepBuilderAPI_MakeFace_4;
  BRepBuilderAPI_MakeFace_5: typeof BRepBuilderAPI_MakeFace_5;
  BRepBuilderAPI_MakeFace_6: typeof BRepBuilderAPI_MakeFace_6;
  BRepBuilderAPI_MakeFace_7: typeof BRepBuilderAPI_MakeFace_7;
  BRepBuilderAPI_MakeFace_8: typeof BRepBuilderAPI_MakeFace_8;
  BRepBuilderAPI_MakeFace_9: typeof BRepBuilderAPI_MakeFace_9;
  BRepBuilderAPI_MakeFace_10: typeof BRepBuilderAPI_MakeFace_10;
  BRepBuilderAPI_MakeFace_11: typeof BRepBuilderAPI_MakeFace_11;
  BRepBuilderAPI_MakeFace_12: typeof BRepBuilderAPI_MakeFace_12;
  BRepBuilderAPI_MakeFace_13: typeof BRepBuilderAPI_MakeFace_13;
  BRepBuilderAPI_MakeFace_14: typeof BRepBuilderAPI_MakeFace_14;
  BRepBuilderAPI_MakeFace_15: typeof BRepBuilderAPI_MakeFace_15;
  BRepBuilderAPI_MakeFace_16: typeof BRepBuilderAPI_MakeFace_16;
  BRepBuilderAPI_MakeFace_17: typeof BRepBuilderAPI_MakeFace_17;
  BRepBuilderAPI_MakeFace_18: typeof BRepBuilderAPI_MakeFace_18;
  BRepBuilderAPI_MakeFace_19: typeof BRepBuilderAPI_MakeFace_19;
  BRepBuilderAPI_MakeFace_20: typeof BRepBuilderAPI_MakeFace_20;
  BRepBuilderAPI_MakeFace_21: typeof BRepBuilderAPI_MakeFace_21;
  BRepBuilderAPI_MakeFace_22: typeof BRepBuilderAPI_MakeFace_22;
  BRepBuilderAPI_MakeWire: typeof BRepBuilderAPI_MakeWire;
  BRepBuilderAPI_MakeWire_1: typeof BRepBuilderAPI_MakeWire_1;
  BRepBuilderAPI_MakeWire_2: typeof BRepBuilderAPI_MakeWire_2;
  BRepBuilderAPI_MakeWire_3: typeof BRepBuilderAPI_MakeWire_3;
  BRepBuilderAPI_MakeWire_4: typeof BRepBuilderAPI_MakeWire_4;
  BRepBuilderAPI_MakeWire_5: typeof BRepBuilderAPI_MakeWire_5;
  BRepBuilderAPI_MakeWire_6: typeof BRepBuilderAPI_MakeWire_6;
  BRepBuilderAPI_MakeWire_7: typeof BRepBuilderAPI_MakeWire_7;
  BRepBuilderAPI_MakeEdge: typeof BRepBuilderAPI_MakeEdge;
  BRepBuilderAPI_MakeEdge_1: typeof BRepBuilderAPI_MakeEdge_1;
  BRepBuilderAPI_MakeEdge_2: typeof BRepBuilderAPI_MakeEdge_2;
  BRepBuilderAPI_MakeEdge_3: typeof BRepBuilderAPI_MakeEdge_3;
  BRepBuilderAPI_MakeEdge_4: typeof BRepBuilderAPI_MakeEdge_4;
  BRepBuilderAPI_MakeEdge_5: typeof BRepBuilderAPI_MakeEdge_5;
  BRepBuilderAPI_MakeEdge_6: typeof BRepBuilderAPI_MakeEdge_6;
  BRepBuilderAPI_MakeEdge_7: typeof BRepBuilderAPI_MakeEdge_7;
  BRepBuilderAPI_MakeEdge_8: typeof BRepBuilderAPI_MakeEdge_8;
  BRepBuilderAPI_MakeEdge_9: typeof BRepBuilderAPI_MakeEdge_9;
  BRepBuilderAPI_MakeEdge_10: typeof BRepBuilderAPI_MakeEdge_10;
  BRepBuilderAPI_MakeEdge_11: typeof BRepBuilderAPI_MakeEdge_11;
  BRepBuilderAPI_MakeEdge_12: typeof BRepBuilderAPI_MakeEdge_12;
  BRepBuilderAPI_MakeEdge_13: typeof BRepBuilderAPI_MakeEdge_13;
  BRepBuilderAPI_MakeEdge_14: typeof BRepBuilderAPI_MakeEdge_14;
  BRepBuilderAPI_MakeEdge_15: typeof BRepBuilderAPI_MakeEdge_15;
  BRepBuilderAPI_MakeEdge_16: typeof BRepBuilderAPI_MakeEdge_16;
  BRepBuilderAPI_MakeEdge_17: typeof BRepBuilderAPI_MakeEdge_17;
  BRepBuilderAPI_MakeEdge_18: typeof BRepBuilderAPI_MakeEdge_18;
  BRepBuilderAPI_MakeEdge_19: typeof BRepBuilderAPI_MakeEdge_19;
  BRepBuilderAPI_MakeEdge_20: typeof BRepBuilderAPI_MakeEdge_20;
  BRepBuilderAPI_MakeEdge_21: typeof BRepBuilderAPI_MakeEdge_21;
  BRepBuilderAPI_MakeEdge_22: typeof BRepBuilderAPI_MakeEdge_22;
  BRepBuilderAPI_MakeEdge_23: typeof BRepBuilderAPI_MakeEdge_23;
  BRepBuilderAPI_MakeEdge_24: typeof BRepBuilderAPI_MakeEdge_24;
  BRepBuilderAPI_MakeEdge_25: typeof BRepBuilderAPI_MakeEdge_25;
  BRepBuilderAPI_MakeEdge_26: typeof BRepBuilderAPI_MakeEdge_26;
  BRepBuilderAPI_MakeEdge_27: typeof BRepBuilderAPI_MakeEdge_27;
  BRepBuilderAPI_MakeEdge_28: typeof BRepBuilderAPI_MakeEdge_28;
  BRepBuilderAPI_MakeEdge_29: typeof BRepBuilderAPI_MakeEdge_29;
  BRepBuilderAPI_MakeEdge_30: typeof BRepBuilderAPI_MakeEdge_30;
  BRepBuilderAPI_MakeEdge_31: typeof BRepBuilderAPI_MakeEdge_31;
  BRepBuilderAPI_MakeEdge_32: typeof BRepBuilderAPI_MakeEdge_32;
  BRepBuilderAPI_MakeEdge_33: typeof BRepBuilderAPI_MakeEdge_33;
  BRepBuilderAPI_MakeEdge_34: typeof BRepBuilderAPI_MakeEdge_34;
  BRepBuilderAPI_MakeEdge_35: typeof BRepBuilderAPI_MakeEdge_35;
  BRepBuilderAPI_Command: typeof BRepBuilderAPI_Command;
  BRepBuilderAPI_MakeShell: typeof BRepBuilderAPI_MakeShell;
  BRepBuilderAPI_MakeShell_1: typeof BRepBuilderAPI_MakeShell_1;
  BRepBuilderAPI_MakeShell_2: typeof BRepBuilderAPI_MakeShell_2;
  BRepBuilderAPI_MakeShell_3: typeof BRepBuilderAPI_MakeShell_3;
  BRepBuilderAPI_Copy: typeof BRepBuilderAPI_Copy;
  BRepBuilderAPI_Copy_1: typeof BRepBuilderAPI_Copy_1;
  BRepBuilderAPI_Copy_2: typeof BRepBuilderAPI_Copy_2;
  BRep_Builder: typeof BRep_Builder;
  BRep_Tool: typeof BRep_Tool;
  GC_MakeArcOfCircle: typeof GC_MakeArcOfCircle;
  GC_MakeArcOfCircle_1: typeof GC_MakeArcOfCircle_1;
  GC_MakeArcOfCircle_2: typeof GC_MakeArcOfCircle_2;
  GC_MakeArcOfCircle_3: typeof GC_MakeArcOfCircle_3;
  GC_MakeArcOfCircle_4: typeof GC_MakeArcOfCircle_4;
  GC_MakeArcOfCircle_5: typeof GC_MakeArcOfCircle_5;
  GC_MakeArcOfEllipse: typeof GC_MakeArcOfEllipse;
  GC_MakeArcOfEllipse_1: typeof GC_MakeArcOfEllipse_1;
  GC_MakeArcOfEllipse_2: typeof GC_MakeArcOfEllipse_2;
  GC_MakeArcOfEllipse_3: typeof GC_MakeArcOfEllipse_3;
  GC_Root: typeof GC_Root;
  GeomAbs_CurveType: GeomAbs_CurveType;
  GeomAbs_JoinType: GeomAbs_JoinType;
  GeomAbs_Shape: GeomAbs_Shape;
  GeomAbs_SurfaceType: GeomAbs_SurfaceType;
  ChFiDS_ChamfMode: ChFiDS_ChamfMode;
  ChFi3d_FilletShape: ChFi3d_FilletShape;
  BndLib_Add2dCurve: typeof BndLib_Add2dCurve;
  gp_Ax3: typeof gp_Ax3;
  gp_Ax3_1: typeof gp_Ax3_1;
  gp_Ax3_2: typeof gp_Ax3_2;
  gp_Ax3_3: typeof gp_Ax3_3;
  gp_Ax3_4: typeof gp_Ax3_4;
  gp_Dir2d: typeof gp_Dir2d;
  gp_Dir2d_1: typeof gp_Dir2d_1;
  gp_Dir2d_2: typeof gp_Dir2d_2;
  gp_Dir2d_3: typeof gp_Dir2d_3;
  gp_Dir2d_4: typeof gp_Dir2d_4;
  gp_GTrsf2d: typeof gp_GTrsf2d;
  gp_GTrsf2d_1: typeof gp_GTrsf2d_1;
  gp_GTrsf2d_2: typeof gp_GTrsf2d_2;
  gp_GTrsf2d_3: typeof gp_GTrsf2d_3;
  gp_Pln: typeof gp_Pln;
  gp_Pln_1: typeof gp_Pln_1;
  gp_Pln_2: typeof gp_Pln_2;
  gp_Pln_3: typeof gp_Pln_3;
  gp_Pln_4: typeof gp_Pln_4;
  gp_Trsf2d: typeof gp_Trsf2d;
  gp_Trsf2d_1: typeof gp_Trsf2d_1;
  gp_Trsf2d_2: typeof gp_Trsf2d_2;
  gp_Elips: typeof gp_Elips;
  gp_Elips_1: typeof gp_Elips_1;
  gp_Elips_2: typeof gp_Elips_2;
  gp_Trsf: typeof gp_Trsf;
  gp_Trsf_1: typeof gp_Trsf_1;
  gp_Trsf_2: typeof gp_Trsf_2;
  gp_Vec2d: typeof gp_Vec2d;
  gp_Vec2d_1: typeof gp_Vec2d_1;
  gp_Vec2d_2: typeof gp_Vec2d_2;
  gp_Vec2d_3: typeof gp_Vec2d_3;
  gp_Vec2d_4: typeof gp_Vec2d_4;
  gp_Vec2d_5: typeof gp_Vec2d_5;
  gp_Circ: typeof gp_Circ;
  gp_Circ_1: typeof gp_Circ_1;
  gp_Circ_2: typeof gp_Circ_2;
  gp_Dir: typeof gp_Dir;
  gp_Dir_1: typeof gp_Dir_1;
  gp_Dir_2: typeof gp_Dir_2;
  gp_Dir_3: typeof gp_Dir_3;
  gp_Dir_4: typeof gp_Dir_4;
  gp_XYZ: typeof gp_XYZ;
  gp_XYZ_1: typeof gp_XYZ_1;
  gp_XYZ_2: typeof gp_XYZ_2;
  gp_GTrsf: typeof gp_GTrsf;
  gp_GTrsf_1: typeof gp_GTrsf_1;
  gp_GTrsf_2: typeof gp_GTrsf_2;
  gp_GTrsf_3: typeof gp_GTrsf_3;
  gp_Ax1: typeof gp_Ax1;
  gp_Ax1_1: typeof gp_Ax1_1;
  gp_Ax1_2: typeof gp_Ax1_2;
  gp_Pnt: typeof gp_Pnt;
  gp_Pnt_1: typeof gp_Pnt_1;
  gp_Pnt_2: typeof gp_Pnt_2;
  gp_Pnt_3: typeof gp_Pnt_3;
  gp_Quaternion: typeof gp_Quaternion;
  gp_Quaternion_1: typeof gp_Quaternion_1;
  gp_Quaternion_2: typeof gp_Quaternion_2;
  gp_Quaternion_3: typeof gp_Quaternion_3;
  gp_Quaternion_4: typeof gp_Quaternion_4;
  gp_Quaternion_5: typeof gp_Quaternion_5;
  gp_Quaternion_6: typeof gp_Quaternion_6;
  gp_Ax2d: typeof gp_Ax2d;
  gp_Ax2d_1: typeof gp_Ax2d_1;
  gp_Ax2d_2: typeof gp_Ax2d_2;
  gp_Elips2d: typeof gp_Elips2d;
  gp_Elips2d_1: typeof gp_Elips2d_1;
  gp_Elips2d_2: typeof gp_Elips2d_2;
  gp_Elips2d_3: typeof gp_Elips2d_3;
  gp_Pnt2d: typeof gp_Pnt2d;
  gp_Pnt2d_1: typeof gp_Pnt2d_1;
  gp_Pnt2d_2: typeof gp_Pnt2d_2;
  gp_Pnt2d_3: typeof gp_Pnt2d_3;
  gp_Vec: typeof gp_Vec;
  gp_Vec_1: typeof gp_Vec_1;
  gp_Vec_2: typeof gp_Vec_2;
  gp_Vec_3: typeof gp_Vec_3;
  gp_Vec_4: typeof gp_Vec_4;
  gp_Vec_5: typeof gp_Vec_5;
  gp_XY: typeof gp_XY;
  gp_XY_1: typeof gp_XY_1;
  gp_XY_2: typeof gp_XY_2;
  gp_Ax2: typeof gp_Ax2;
  gp_Ax2_1: typeof gp_Ax2_1;
  gp_Ax2_2: typeof gp_Ax2_2;
  gp_Ax2_3: typeof gp_Ax2_3;
  gp_Cylinder: typeof gp_Cylinder;
  gp_Cylinder_1: typeof gp_Cylinder_1;
  gp_Cylinder_2: typeof gp_Cylinder_2;
  ShapeAnalysis_Surface: typeof ShapeAnalysis_Surface;
  ShapeAnalysis_FreeBounds: typeof ShapeAnalysis_FreeBounds;
  ShapeAnalysis_FreeBounds_1: typeof ShapeAnalysis_FreeBounds_1;
  ShapeAnalysis_FreeBounds_2: typeof ShapeAnalysis_FreeBounds_2;
  ShapeAnalysis_FreeBounds_3: typeof ShapeAnalysis_FreeBounds_3;
  ShapeAnalysis_Edge: typeof ShapeAnalysis_Edge;
  ShapeAnalysis_Wire: typeof ShapeAnalysis_Wire;
  ShapeAnalysis_Wire_1: typeof ShapeAnalysis_Wire_1;
  ShapeAnalysis_Wire_2: typeof ShapeAnalysis_Wire_2;
  ShapeAnalysis_Wire_3: typeof ShapeAnalysis_Wire_3;
  Bnd_Box2d: typeof Bnd_Box2d;
  Bnd_Box: typeof Bnd_Box;
  Bnd_Box_1: typeof Bnd_Box_1;
  Bnd_Box_2: typeof Bnd_Box_2;
  BOPAlgo_GlueEnum: BOPAlgo_GlueEnum;
  Handle_GeomFill_Boundary: typeof Handle_GeomFill_Boundary;
  Handle_GeomFill_Boundary_1: typeof Handle_GeomFill_Boundary_1;
  Handle_GeomFill_Boundary_2: typeof Handle_GeomFill_Boundary_2;
  Handle_GeomFill_Boundary_3: typeof Handle_GeomFill_Boundary_3;
  Handle_GeomFill_Boundary_4: typeof Handle_GeomFill_Boundary_4;
  GeomFill_ConstrainedFilling: typeof GeomFill_ConstrainedFilling;
  GeomFill_SimpleBound: typeof GeomFill_SimpleBound;
  BRepPrimAPI_MakeCylinder: typeof BRepPrimAPI_MakeCylinder;
  BRepPrimAPI_MakeCylinder_1: typeof BRepPrimAPI_MakeCylinder_1;
  BRepPrimAPI_MakeCylinder_2: typeof BRepPrimAPI_MakeCylinder_2;
  BRepPrimAPI_MakeCylinder_3: typeof BRepPrimAPI_MakeCylinder_3;
  BRepPrimAPI_MakeCylinder_4: typeof BRepPrimAPI_MakeCylinder_4;
  BRepPrimAPI_MakeOneAxis: typeof BRepPrimAPI_MakeOneAxis;
  BRepPrimAPI_MakeSweep: typeof BRepPrimAPI_MakeSweep;
  BRepPrimAPI_MakeBox: typeof BRepPrimAPI_MakeBox;
  BRepPrimAPI_MakeBox_1: typeof BRepPrimAPI_MakeBox_1;
  BRepPrimAPI_MakeBox_2: typeof BRepPrimAPI_MakeBox_2;
  BRepPrimAPI_MakeBox_3: typeof BRepPrimAPI_MakeBox_3;
  BRepPrimAPI_MakeBox_4: typeof BRepPrimAPI_MakeBox_4;
  BRepPrimAPI_MakeBox_5: typeof BRepPrimAPI_MakeBox_5;
  BRepPrimAPI_MakeCone: typeof BRepPrimAPI_MakeCone;
  BRepPrimAPI_MakeCone_1: typeof BRepPrimAPI_MakeCone_1;
  BRepPrimAPI_MakeCone_2: typeof BRepPrimAPI_MakeCone_2;
  BRepPrimAPI_MakeCone_3: typeof BRepPrimAPI_MakeCone_3;
  BRepPrimAPI_MakeCone_4: typeof BRepPrimAPI_MakeCone_4;
  BRepPrimAPI_MakeTorus: typeof BRepPrimAPI_MakeTorus;
  BRepPrimAPI_MakeTorus_1: typeof BRepPrimAPI_MakeTorus_1;
  BRepPrimAPI_MakeTorus_2: typeof BRepPrimAPI_MakeTorus_2;
  BRepPrimAPI_MakeTorus_3: typeof BRepPrimAPI_MakeTorus_3;
  BRepPrimAPI_MakeTorus_4: typeof BRepPrimAPI_MakeTorus_4;
  BRepPrimAPI_MakeTorus_5: typeof BRepPrimAPI_MakeTorus_5;
  BRepPrimAPI_MakeTorus_6: typeof BRepPrimAPI_MakeTorus_6;
  BRepPrimAPI_MakeTorus_7: typeof BRepPrimAPI_MakeTorus_7;
  BRepPrimAPI_MakeTorus_8: typeof BRepPrimAPI_MakeTorus_8;
  BRepPrimAPI_MakePrism: typeof BRepPrimAPI_MakePrism;
  BRepPrimAPI_MakePrism_1: typeof BRepPrimAPI_MakePrism_1;
  BRepPrimAPI_MakePrism_2: typeof BRepPrimAPI_MakePrism_2;
  BRepPrimAPI_MakeRevol: typeof BRepPrimAPI_MakeRevol;
  BRepPrimAPI_MakeRevol_1: typeof BRepPrimAPI_MakeRevol_1;
  BRepPrimAPI_MakeRevol_2: typeof BRepPrimAPI_MakeRevol_2;
  BRepPrimAPI_MakeRevolution: typeof BRepPrimAPI_MakeRevolution;
  BRepPrimAPI_MakeRevolution_1: typeof BRepPrimAPI_MakeRevolution_1;
  BRepPrimAPI_MakeRevolution_2: typeof BRepPrimAPI_MakeRevolution_2;
  BRepPrimAPI_MakeRevolution_3: typeof BRepPrimAPI_MakeRevolution_3;
  BRepPrimAPI_MakeRevolution_4: typeof BRepPrimAPI_MakeRevolution_4;
  BRepPrimAPI_MakeRevolution_5: typeof BRepPrimAPI_MakeRevolution_5;
  BRepPrimAPI_MakeRevolution_6: typeof BRepPrimAPI_MakeRevolution_6;
  BRepPrimAPI_MakeRevolution_7: typeof BRepPrimAPI_MakeRevolution_7;
  BRepPrimAPI_MakeRevolution_8: typeof BRepPrimAPI_MakeRevolution_8;
  BRepPrimAPI_MakeSphere: typeof BRepPrimAPI_MakeSphere;
  BRepPrimAPI_MakeSphere_1: typeof BRepPrimAPI_MakeSphere_1;
  BRepPrimAPI_MakeSphere_2: typeof BRepPrimAPI_MakeSphere_2;
  BRepPrimAPI_MakeSphere_3: typeof BRepPrimAPI_MakeSphere_3;
  BRepPrimAPI_MakeSphere_4: typeof BRepPrimAPI_MakeSphere_4;
  BRepPrimAPI_MakeSphere_5: typeof BRepPrimAPI_MakeSphere_5;
  BRepPrimAPI_MakeSphere_6: typeof BRepPrimAPI_MakeSphere_6;
  BRepPrimAPI_MakeSphere_7: typeof BRepPrimAPI_MakeSphere_7;
  BRepPrimAPI_MakeSphere_8: typeof BRepPrimAPI_MakeSphere_8;
  BRepPrimAPI_MakeSphere_9: typeof BRepPrimAPI_MakeSphere_9;
  BRepPrimAPI_MakeSphere_10: typeof BRepPrimAPI_MakeSphere_10;
  BRepPrimAPI_MakeSphere_11: typeof BRepPrimAPI_MakeSphere_11;
  BRepPrimAPI_MakeSphere_12: typeof BRepPrimAPI_MakeSphere_12;
  Adaptor3d_Curve: typeof Adaptor3d_Curve;
  Adaptor3d_Surface: typeof Adaptor3d_Surface;
  BRepOffset_Mode: BRepOffset_Mode;
  TopTools_ListOfShape: typeof TopTools_ListOfShape;
  TopTools_ListOfShape_1: typeof TopTools_ListOfShape_1;
  TopTools_ListOfShape_2: typeof TopTools_ListOfShape_2;
  TopTools_ListOfShape_3: typeof TopTools_ListOfShape_3;
  TopAbs_ShapeEnum: TopAbs_ShapeEnum;
  TopAbs_Orientation: TopAbs_Orientation;
  BRepAlgoAPI_Common: typeof BRepAlgoAPI_Common;
  BRepAlgoAPI_Common_1: typeof BRepAlgoAPI_Common_1;
  BRepAlgoAPI_Common_2: typeof BRepAlgoAPI_Common_2;
  BRepAlgoAPI_Common_3: typeof BRepAlgoAPI_Common_3;
  BRepAlgoAPI_Common_4: typeof BRepAlgoAPI_Common_4;
  BRepAlgoAPI_Algo: typeof BRepAlgoAPI_Algo;
  BRepAlgoAPI_Cut: typeof BRepAlgoAPI_Cut;
  BRepAlgoAPI_Cut_1: typeof BRepAlgoAPI_Cut_1;
  BRepAlgoAPI_Cut_2: typeof BRepAlgoAPI_Cut_2;
  BRepAlgoAPI_Cut_3: typeof BRepAlgoAPI_Cut_3;
  BRepAlgoAPI_Cut_4: typeof BRepAlgoAPI_Cut_4;
  BRepAlgoAPI_BuilderAlgo: typeof BRepAlgoAPI_BuilderAlgo;
  BRepAlgoAPI_BuilderAlgo_1: typeof BRepAlgoAPI_BuilderAlgo_1;
  BRepAlgoAPI_BuilderAlgo_2: typeof BRepAlgoAPI_BuilderAlgo_2;
  BRepAlgoAPI_Fuse: typeof BRepAlgoAPI_Fuse;
  BRepAlgoAPI_Fuse_1: typeof BRepAlgoAPI_Fuse_1;
  BRepAlgoAPI_Fuse_2: typeof BRepAlgoAPI_Fuse_2;
  BRepAlgoAPI_Fuse_3: typeof BRepAlgoAPI_Fuse_3;
  BRepAlgoAPI_Fuse_4: typeof BRepAlgoAPI_Fuse_4;
  BRepAlgoAPI_BooleanOperation: typeof BRepAlgoAPI_BooleanOperation;
  BRepAlgoAPI_BooleanOperation_1: typeof BRepAlgoAPI_BooleanOperation_1;
  BRepAlgoAPI_BooleanOperation_2: typeof BRepAlgoAPI_BooleanOperation_2;
  BRepAlgoAPI_Section: typeof BRepAlgoAPI_Section;
  BRepAlgoAPI_Section_1: typeof BRepAlgoAPI_Section_1;
  BRepAlgoAPI_Section_2: typeof BRepAlgoAPI_Section_2;
  BRepAlgoAPI_Section_3: typeof BRepAlgoAPI_Section_3;
  BRepAlgoAPI_Section_4: typeof BRepAlgoAPI_Section_4;
  BRepAlgoAPI_Section_5: typeof BRepAlgoAPI_Section_5;
  BRepAlgoAPI_Section_6: typeof BRepAlgoAPI_Section_6;
  BRepAlgoAPI_Section_7: typeof BRepAlgoAPI_Section_7;
  BRepAlgoAPI_Section_8: typeof BRepAlgoAPI_Section_8;
  Law_Function: typeof Law_Function;
  Handle_Law_Function: typeof Handle_Law_Function;
  Handle_Law_Function_1: typeof Handle_Law_Function_1;
  Handle_Law_Function_2: typeof Handle_Law_Function_2;
  Handle_Law_Function_3: typeof Handle_Law_Function_3;
  Handle_Law_Function_4: typeof Handle_Law_Function_4;
  Law_BSpFunc: typeof Law_BSpFunc;
  Law_BSpFunc_1: typeof Law_BSpFunc_1;
  Law_BSpFunc_2: typeof Law_BSpFunc_2;
  Law_Interpol: typeof Law_Interpol;
  Law_Linear: typeof Law_Linear;
  Law_S: typeof Law_S;
  Law_Composite: typeof Law_Composite;
  Law_Composite_1: typeof Law_Composite_1;
  Law_Composite_2: typeof Law_Composite_2;
  IntTools_EdgeEdge: typeof IntTools_EdgeEdge;
  IntTools_EdgeEdge_1: typeof IntTools_EdgeEdge_1;
  IntTools_EdgeEdge_2: typeof IntTools_EdgeEdge_2;
  IntTools_EdgeEdge_3: typeof IntTools_EdgeEdge_3;
  IntTools_FaceFace: typeof IntTools_FaceFace;
  BRepExtrema_DistShapeShape: typeof BRepExtrema_DistShapeShape;
  BRepExtrema_DistShapeShape_1: typeof BRepExtrema_DistShapeShape_1;
  BRepExtrema_DistShapeShape_2: typeof BRepExtrema_DistShapeShape_2;
  BRepExtrema_DistShapeShape_3: typeof BRepExtrema_DistShapeShape_3;
  BRepOffsetAPI_MakePipe: typeof BRepOffsetAPI_MakePipe;
  BRepOffsetAPI_MakePipe_1: typeof BRepOffsetAPI_MakePipe_1;
  BRepOffsetAPI_MakePipe_2: typeof BRepOffsetAPI_MakePipe_2;
  BRepOffsetAPI_MakePipeShell: typeof BRepOffsetAPI_MakePipeShell;
  BRepOffsetAPI_MakeOffsetShape: typeof BRepOffsetAPI_MakeOffsetShape;
  BRepOffsetAPI_MakeThickSolid: typeof BRepOffsetAPI_MakeThickSolid;
  BRepOffsetAPI_MakeOffset: typeof BRepOffsetAPI_MakeOffset;
  BRepOffsetAPI_MakeOffset_1: typeof BRepOffsetAPI_MakeOffset_1;
  BRepOffsetAPI_MakeOffset_2: typeof BRepOffsetAPI_MakeOffset_2;
  BRepOffsetAPI_MakeOffset_3: typeof BRepOffsetAPI_MakeOffset_3;
  BRepOffsetAPI_ThruSections: typeof BRepOffsetAPI_ThruSections;
  BRepOffsetAPI_MakeFilling: typeof BRepOffsetAPI_MakeFilling;
  Standard_Transient: typeof Standard_Transient;
  Standard_Transient_1: typeof Standard_Transient_1;
  Standard_Transient_2: typeof Standard_Transient_2;
  StdPrs_ToolTriangulatedShape: typeof StdPrs_ToolTriangulatedShape;
  STEPControl_Writer: typeof STEPControl_Writer;
  STEPControl_Writer_1: typeof STEPControl_Writer_1;
  STEPControl_Writer_2: typeof STEPControl_Writer_2;
  STEPControl_StepModelType: STEPControl_StepModelType;
  BRepLib_FindSurface: typeof BRepLib_FindSurface;
  BRepLib_FindSurface_1: typeof BRepLib_FindSurface_1;
  BRepLib_FindSurface_2: typeof BRepLib_FindSurface_2;
  BRepLib: typeof BRepLib;
  TopExp_Explorer: typeof TopExp_Explorer;
  TopExp_Explorer_1: typeof TopExp_Explorer_1;
  TopExp_Explorer_2: typeof TopExp_Explorer_2;
  StlAPI_Writer: typeof StlAPI_Writer;
  BRepFill_TypeOfContact: BRepFill_TypeOfContact;
  BRepCheck_Analyzer: typeof BRepCheck_Analyzer;
  BRepTools_ReShape: typeof BRepTools_ReShape;
  BRepTools: typeof BRepTools;
  Message_ProgressRange: typeof Message_ProgressRange;
  Message_ProgressRange_1: typeof Message_ProgressRange_1;
  Message_ProgressRange_2: typeof Message_ProgressRange_2;
  Geom2dAPI_InterCurveCurve: typeof Geom2dAPI_InterCurveCurve;
  Geom2dAPI_InterCurveCurve_1: typeof Geom2dAPI_InterCurveCurve_1;
  Geom2dAPI_InterCurveCurve_2: typeof Geom2dAPI_InterCurveCurve_2;
  Geom2dAPI_InterCurveCurve_3: typeof Geom2dAPI_InterCurveCurve_3;
  GCE2d_MakeArcOfCircle: typeof GCE2d_MakeArcOfCircle;
  GCE2d_MakeArcOfCircle_1: typeof GCE2d_MakeArcOfCircle_1;
  GCE2d_MakeArcOfCircle_2: typeof GCE2d_MakeArcOfCircle_2;
  GCE2d_MakeArcOfCircle_3: typeof GCE2d_MakeArcOfCircle_3;
  GCE2d_MakeArcOfCircle_4: typeof GCE2d_MakeArcOfCircle_4;
  GCE2d_MakeArcOfCircle_5: typeof GCE2d_MakeArcOfCircle_5;
  GCE2d_Root: typeof GCE2d_Root;
  GCE2d_MakeArcOfEllipse: typeof GCE2d_MakeArcOfEllipse;
  GCE2d_MakeArcOfEllipse_1: typeof GCE2d_MakeArcOfEllipse_1;
  GCE2d_MakeArcOfEllipse_2: typeof GCE2d_MakeArcOfEllipse_2;
  GCE2d_MakeArcOfEllipse_3: typeof GCE2d_MakeArcOfEllipse_3;
  GCE2d_MakeSegment: typeof GCE2d_MakeSegment;
  GCE2d_MakeSegment_1: typeof GCE2d_MakeSegment_1;
  GCE2d_MakeSegment_2: typeof GCE2d_MakeSegment_2;
  GCE2d_MakeSegment_3: typeof GCE2d_MakeSegment_3;
  GCE2d_MakeSegment_4: typeof GCE2d_MakeSegment_4;
  GCE2d_MakeSegment_5: typeof GCE2d_MakeSegment_5;
  Precision: typeof Precision;
  IFSelect_ReturnStatus: IFSelect_ReturnStatus;
  GProp_GProps: typeof GProp_GProps;
  GProp_GProps_1: typeof GProp_GProps_1;
  GProp_GProps_2: typeof GProp_GProps_2;
  Handle_Geom2d_BoundedCurve: typeof Handle_Geom2d_BoundedCurve;
  Handle_Geom2d_BoundedCurve_1: typeof Handle_Geom2d_BoundedCurve_1;
  Handle_Geom2d_BoundedCurve_2: typeof Handle_Geom2d_BoundedCurve_2;
  Handle_Geom2d_BoundedCurve_3: typeof Handle_Geom2d_BoundedCurve_3;
  Handle_Geom2d_BoundedCurve_4: typeof Handle_Geom2d_BoundedCurve_4;
  Geom2d_BoundedCurve: typeof Geom2d_BoundedCurve;
  Geom2d_Geometry: typeof Geom2d_Geometry;
  Handle_Geom2d_Geometry: typeof Handle_Geom2d_Geometry;
  Handle_Geom2d_Geometry_1: typeof Handle_Geom2d_Geometry_1;
  Handle_Geom2d_Geometry_2: typeof Handle_Geom2d_Geometry_2;
  Handle_Geom2d_Geometry_3: typeof Handle_Geom2d_Geometry_3;
  Handle_Geom2d_Geometry_4: typeof Handle_Geom2d_Geometry_4;
  Handle_Geom2d_Line: typeof Handle_Geom2d_Line;
  Handle_Geom2d_Line_1: typeof Handle_Geom2d_Line_1;
  Handle_Geom2d_Line_2: typeof Handle_Geom2d_Line_2;
  Handle_Geom2d_Line_3: typeof Handle_Geom2d_Line_3;
  Handle_Geom2d_Line_4: typeof Handle_Geom2d_Line_4;
  Geom2d_Line: typeof Geom2d_Line;
  Geom2d_Line_1: typeof Geom2d_Line_1;
  Geom2d_Line_2: typeof Geom2d_Line_2;
  Geom2d_Line_3: typeof Geom2d_Line_3;
  Geom2d_TrimmedCurve: typeof Geom2d_TrimmedCurve;
  Handle_Geom2d_TrimmedCurve: typeof Handle_Geom2d_TrimmedCurve;
  Handle_Geom2d_TrimmedCurve_1: typeof Handle_Geom2d_TrimmedCurve_1;
  Handle_Geom2d_TrimmedCurve_2: typeof Handle_Geom2d_TrimmedCurve_2;
  Handle_Geom2d_TrimmedCurve_3: typeof Handle_Geom2d_TrimmedCurve_3;
  Handle_Geom2d_TrimmedCurve_4: typeof Handle_Geom2d_TrimmedCurve_4;
  Geom2d_BezierCurve: typeof Geom2d_BezierCurve;
  Geom2d_BezierCurve_1: typeof Geom2d_BezierCurve_1;
  Geom2d_BezierCurve_2: typeof Geom2d_BezierCurve_2;
  Handle_Geom2d_BezierCurve: typeof Handle_Geom2d_BezierCurve;
  Handle_Geom2d_BezierCurve_1: typeof Handle_Geom2d_BezierCurve_1;
  Handle_Geom2d_BezierCurve_2: typeof Handle_Geom2d_BezierCurve_2;
  Handle_Geom2d_BezierCurve_3: typeof Handle_Geom2d_BezierCurve_3;
  Handle_Geom2d_BezierCurve_4: typeof Handle_Geom2d_BezierCurve_4;
  Handle_Geom2d_BSplineCurve: typeof Handle_Geom2d_BSplineCurve;
  Handle_Geom2d_BSplineCurve_1: typeof Handle_Geom2d_BSplineCurve_1;
  Handle_Geom2d_BSplineCurve_2: typeof Handle_Geom2d_BSplineCurve_2;
  Handle_Geom2d_BSplineCurve_3: typeof Handle_Geom2d_BSplineCurve_3;
  Handle_Geom2d_BSplineCurve_4: typeof Handle_Geom2d_BSplineCurve_4;
  Geom2d_BSplineCurve: typeof Geom2d_BSplineCurve;
  Geom2d_BSplineCurve_1: typeof Geom2d_BSplineCurve_1;
  Geom2d_BSplineCurve_2: typeof Geom2d_BSplineCurve_2;
  Handle_Geom2d_Curve: typeof Handle_Geom2d_Curve;
  Handle_Geom2d_Curve_1: typeof Handle_Geom2d_Curve_1;
  Handle_Geom2d_Curve_2: typeof Handle_Geom2d_Curve_2;
  Handle_Geom2d_Curve_3: typeof Handle_Geom2d_Curve_3;
  Handle_Geom2d_Curve_4: typeof Handle_Geom2d_Curve_4;
  Geom2d_Curve: typeof Geom2d_Curve;
  Geom2d_Circle: typeof Geom2d_Circle;
  Geom2d_Circle_1: typeof Geom2d_Circle_1;
  Geom2d_Circle_2: typeof Geom2d_Circle_2;
  Geom2d_Circle_3: typeof Geom2d_Circle_3;
  Handle_Geom2d_Circle: typeof Handle_Geom2d_Circle;
  Handle_Geom2d_Circle_1: typeof Handle_Geom2d_Circle_1;
  Handle_Geom2d_Circle_2: typeof Handle_Geom2d_Circle_2;
  Handle_Geom2d_Circle_3: typeof Handle_Geom2d_Circle_3;
  Handle_Geom2d_Circle_4: typeof Handle_Geom2d_Circle_4;
  Handle_Geom2d_Ellipse: typeof Handle_Geom2d_Ellipse;
  Handle_Geom2d_Ellipse_1: typeof Handle_Geom2d_Ellipse_1;
  Handle_Geom2d_Ellipse_2: typeof Handle_Geom2d_Ellipse_2;
  Handle_Geom2d_Ellipse_3: typeof Handle_Geom2d_Ellipse_3;
  Handle_Geom2d_Ellipse_4: typeof Handle_Geom2d_Ellipse_4;
  Geom2d_Ellipse: typeof Geom2d_Ellipse;
  Geom2d_Ellipse_1: typeof Geom2d_Ellipse_1;
  Geom2d_Ellipse_2: typeof Geom2d_Ellipse_2;
  Geom2d_Ellipse_3: typeof Geom2d_Ellipse_3;
  Extrema_ExtAlgo: Extrema_ExtAlgo;
  TColgp_Array1OfDir: typeof TColgp_Array1OfDir;
  TColgp_Array1OfDir_1: typeof TColgp_Array1OfDir_1;
  TColgp_Array1OfDir_2: typeof TColgp_Array1OfDir_2;
  TColgp_Array1OfDir_3: typeof TColgp_Array1OfDir_3;
  TColgp_Array1OfDir_4: typeof TColgp_Array1OfDir_4;
  TColgp_Array1OfDir_5: typeof TColgp_Array1OfDir_5;
  Handle_TColgp_HArray1OfPnt: typeof Handle_TColgp_HArray1OfPnt;
  Handle_TColgp_HArray1OfPnt_1: typeof Handle_TColgp_HArray1OfPnt_1;
  Handle_TColgp_HArray1OfPnt_2: typeof Handle_TColgp_HArray1OfPnt_2;
  Handle_TColgp_HArray1OfPnt_3: typeof Handle_TColgp_HArray1OfPnt_3;
  Handle_TColgp_HArray1OfPnt_4: typeof Handle_TColgp_HArray1OfPnt_4;
  TColgp_Array1OfPnt: typeof TColgp_Array1OfPnt;
  TColgp_Array1OfPnt_1: typeof TColgp_Array1OfPnt_1;
  TColgp_Array1OfPnt_2: typeof TColgp_Array1OfPnt_2;
  TColgp_Array1OfPnt_3: typeof TColgp_Array1OfPnt_3;
  TColgp_Array1OfPnt_4: typeof TColgp_Array1OfPnt_4;
  TColgp_Array1OfPnt_5: typeof TColgp_Array1OfPnt_5;
  TColgp_Array1OfVec: typeof TColgp_Array1OfVec;
  TColgp_Array1OfVec_1: typeof TColgp_Array1OfVec_1;
  TColgp_Array1OfVec_2: typeof TColgp_Array1OfVec_2;
  TColgp_Array1OfVec_3: typeof TColgp_Array1OfVec_3;
  TColgp_Array1OfVec_4: typeof TColgp_Array1OfVec_4;
  TColgp_Array1OfVec_5: typeof TColgp_Array1OfVec_5;
  TColgp_Array2OfPnt: typeof TColgp_Array2OfPnt;
  TColgp_Array2OfPnt_1: typeof TColgp_Array2OfPnt_1;
  TColgp_Array2OfPnt_2: typeof TColgp_Array2OfPnt_2;
  TColgp_Array2OfPnt_3: typeof TColgp_Array2OfPnt_3;
  TColgp_Array2OfPnt_4: typeof TColgp_Array2OfPnt_4;
  TColgp_Array2OfPnt_5: typeof TColgp_Array2OfPnt_5;
  TColgp_Array1OfPnt2d: typeof TColgp_Array1OfPnt2d;
  TColgp_Array1OfPnt2d_1: typeof TColgp_Array1OfPnt2d_1;
  TColgp_Array1OfPnt2d_2: typeof TColgp_Array1OfPnt2d_2;
  TColgp_Array1OfPnt2d_3: typeof TColgp_Array1OfPnt2d_3;
  TColgp_Array1OfPnt2d_4: typeof TColgp_Array1OfPnt2d_4;
  TColgp_Array1OfPnt2d_5: typeof TColgp_Array1OfPnt2d_5;
  GeomLib: typeof GeomLib;
  Poly_Connect: typeof Poly_Connect;
  Poly_Connect_1: typeof Poly_Connect_1;
  Poly_Connect_2: typeof Poly_Connect_2;
  Handle_Poly_PolygonOnTriangulation: typeof Handle_Poly_PolygonOnTriangulation;
  Handle_Poly_PolygonOnTriangulation_1: typeof Handle_Poly_PolygonOnTriangulation_1;
  Handle_Poly_PolygonOnTriangulation_2: typeof Handle_Poly_PolygonOnTriangulation_2;
  Handle_Poly_PolygonOnTriangulation_3: typeof Handle_Poly_PolygonOnTriangulation_3;
  Handle_Poly_PolygonOnTriangulation_4: typeof Handle_Poly_PolygonOnTriangulation_4;
  Poly_PolygonOnTriangulation: typeof Poly_PolygonOnTriangulation;
  Poly_PolygonOnTriangulation_1: typeof Poly_PolygonOnTriangulation_1;
  Poly_PolygonOnTriangulation_2: typeof Poly_PolygonOnTriangulation_2;
  Poly_PolygonOnTriangulation_3: typeof Poly_PolygonOnTriangulation_3;
  Poly_Triangle: typeof Poly_Triangle;
  Poly_Triangle_1: typeof Poly_Triangle_1;
  Poly_Triangle_2: typeof Poly_Triangle_2;
  Poly_Array1OfTriangle: typeof Poly_Array1OfTriangle;
  Poly_Array1OfTriangle_1: typeof Poly_Array1OfTriangle_1;
  Poly_Array1OfTriangle_2: typeof Poly_Array1OfTriangle_2;
  Poly_Array1OfTriangle_3: typeof Poly_Array1OfTriangle_3;
  Poly_Array1OfTriangle_4: typeof Poly_Array1OfTriangle_4;
  Poly_Array1OfTriangle_5: typeof Poly_Array1OfTriangle_5;
  Handle_Poly_Triangulation: typeof Handle_Poly_Triangulation;
  Handle_Poly_Triangulation_1: typeof Handle_Poly_Triangulation_1;
  Handle_Poly_Triangulation_2: typeof Handle_Poly_Triangulation_2;
  Handle_Poly_Triangulation_3: typeof Handle_Poly_Triangulation_3;
  Handle_Poly_Triangulation_4: typeof Handle_Poly_Triangulation_4;
  Poly_Triangulation: typeof Poly_Triangulation;
  Poly_Triangulation_1: typeof Poly_Triangulation_1;
  Poly_Triangulation_2: typeof Poly_Triangulation_2;
  Poly_Triangulation_3: typeof Poly_Triangulation_3;
  Poly_Triangulation_4: typeof Poly_Triangulation_4;
  Poly_Triangulation_5: typeof Poly_Triangulation_5;
  Handle_TColStd_HArray1OfBoolean: typeof Handle_TColStd_HArray1OfBoolean;
  Handle_TColStd_HArray1OfBoolean_1: typeof Handle_TColStd_HArray1OfBoolean_1;
  Handle_TColStd_HArray1OfBoolean_2: typeof Handle_TColStd_HArray1OfBoolean_2;
  Handle_TColStd_HArray1OfBoolean_3: typeof Handle_TColStd_HArray1OfBoolean_3;
  Handle_TColStd_HArray1OfBoolean_4: typeof Handle_TColStd_HArray1OfBoolean_4;
  TColStd_Array1OfInteger: typeof TColStd_Array1OfInteger;
  TColStd_Array1OfInteger_1: typeof TColStd_Array1OfInteger_1;
  TColStd_Array1OfInteger_2: typeof TColStd_Array1OfInteger_2;
  TColStd_Array1OfInteger_3: typeof TColStd_Array1OfInteger_3;
  TColStd_Array1OfInteger_4: typeof TColStd_Array1OfInteger_4;
  TColStd_Array1OfInteger_5: typeof TColStd_Array1OfInteger_5;
  TColStd_Array1OfBoolean: typeof TColStd_Array1OfBoolean;
  TColStd_Array1OfBoolean_1: typeof TColStd_Array1OfBoolean_1;
  TColStd_Array1OfBoolean_2: typeof TColStd_Array1OfBoolean_2;
  TColStd_Array1OfBoolean_3: typeof TColStd_Array1OfBoolean_3;
  TColStd_Array1OfBoolean_4: typeof TColStd_Array1OfBoolean_4;
  TColStd_Array1OfBoolean_5: typeof TColStd_Array1OfBoolean_5;
  GCPnts_TangentialDeflection: typeof GCPnts_TangentialDeflection;
  GCPnts_TangentialDeflection_1: typeof GCPnts_TangentialDeflection_1;
  GCPnts_TangentialDeflection_2: typeof GCPnts_TangentialDeflection_2;
  GCPnts_TangentialDeflection_3: typeof GCPnts_TangentialDeflection_3;
  GCPnts_TangentialDeflection_4: typeof GCPnts_TangentialDeflection_4;
  GCPnts_TangentialDeflection_5: typeof GCPnts_TangentialDeflection_5;
  BRepFeat_MakeDPrism: typeof BRepFeat_MakeDPrism;
  BRepFeat_MakeDPrism_1: typeof BRepFeat_MakeDPrism_1;
  BRepFeat_MakeDPrism_2: typeof BRepFeat_MakeDPrism_2;
  BRepFeat_Form: typeof BRepFeat_Form;
  GeomAPI_ProjectPointOnSurf: typeof GeomAPI_ProjectPointOnSurf;
  GeomAPI_ProjectPointOnSurf_1: typeof GeomAPI_ProjectPointOnSurf_1;
  GeomAPI_ProjectPointOnSurf_2: typeof GeomAPI_ProjectPointOnSurf_2;
  GeomAPI_ProjectPointOnSurf_3: typeof GeomAPI_ProjectPointOnSurf_3;
  GeomAPI_ProjectPointOnSurf_4: typeof GeomAPI_ProjectPointOnSurf_4;
  GeomAPI_ProjectPointOnSurf_5: typeof GeomAPI_ProjectPointOnSurf_5;
  GeomAPI_ProjectPointOnCurve: typeof GeomAPI_ProjectPointOnCurve;
  GeomAPI_ProjectPointOnCurve_1: typeof GeomAPI_ProjectPointOnCurve_1;
  GeomAPI_ProjectPointOnCurve_2: typeof GeomAPI_ProjectPointOnCurve_2;
  GeomAPI_ProjectPointOnCurve_3: typeof GeomAPI_ProjectPointOnCurve_3;
  GeomAPI_PointsToBSpline: typeof GeomAPI_PointsToBSpline;
  GeomAPI_PointsToBSpline_1: typeof GeomAPI_PointsToBSpline_1;
  GeomAPI_PointsToBSpline_2: typeof GeomAPI_PointsToBSpline_2;
  GeomAPI_PointsToBSpline_3: typeof GeomAPI_PointsToBSpline_3;
  GeomAPI_PointsToBSpline_4: typeof GeomAPI_PointsToBSpline_4;
  GeomAPI_PointsToBSpline_5: typeof GeomAPI_PointsToBSpline_5;
  GeomAPI_PointsToBSplineSurface: typeof GeomAPI_PointsToBSplineSurface;
  GeomAPI_PointsToBSplineSurface_1: typeof GeomAPI_PointsToBSplineSurface_1;
  GeomAPI_PointsToBSplineSurface_2: typeof GeomAPI_PointsToBSplineSurface_2;
  GeomAPI_PointsToBSplineSurface_3: typeof GeomAPI_PointsToBSplineSurface_3;
  GeomAPI_PointsToBSplineSurface_4: typeof GeomAPI_PointsToBSplineSurface_4;
  GeomAPI_PointsToBSplineSurface_5: typeof GeomAPI_PointsToBSplineSurface_5;
  GeomAPI_Interpolate: typeof GeomAPI_Interpolate;
  GeomAPI_Interpolate_1: typeof GeomAPI_Interpolate_1;
  GeomAPI_Interpolate_2: typeof GeomAPI_Interpolate_2;
  BRepBndLib: typeof BRepBndLib;
  ShapeFix_Face: typeof ShapeFix_Face;
  ShapeFix_Face_1: typeof ShapeFix_Face_1;
  ShapeFix_Face_2: typeof ShapeFix_Face_2;
  ShapeFix_Wire: typeof ShapeFix_Wire;
  ShapeFix_Wire_1: typeof ShapeFix_Wire_1;
  ShapeFix_Wire_2: typeof ShapeFix_Wire_2;
  ShapeFix_Shape: typeof ShapeFix_Shape;
  ShapeFix_Shape_1: typeof ShapeFix_Shape_1;
  ShapeFix_Shape_2: typeof ShapeFix_Shape_2;
  ShapeFix_Root: typeof ShapeFix_Root;
  ShapeFix_Solid: typeof ShapeFix_Solid;
  ShapeFix_Solid_1: typeof ShapeFix_Solid_1;
  ShapeFix_Solid_2: typeof ShapeFix_Solid_2;
  GeomLProp_CLProps: typeof GeomLProp_CLProps;
  GeomLProp_CLProps_1: typeof GeomLProp_CLProps_1;
  GeomLProp_CLProps_2: typeof GeomLProp_CLProps_2;
  GeomLProp_CLProps_3: typeof GeomLProp_CLProps_3;
  GeomLProp_SLProps: typeof GeomLProp_SLProps;
  GeomLProp_SLProps_1: typeof GeomLProp_SLProps_1;
  GeomLProp_SLProps_2: typeof GeomLProp_SLProps_2;
  GeomLProp_SLProps_3: typeof GeomLProp_SLProps_3;
  NCollection_BaseList: typeof NCollection_BaseList;
  BRepGProp: typeof BRepGProp;
  BRepGProp_Face: typeof BRepGProp_Face;
  BRepGProp_Face_1: typeof BRepGProp_Face_1;
  BRepGProp_Face_2: typeof BRepGProp_Face_2;
  Geom_ElementarySurface: typeof Geom_ElementarySurface;
  Geom_TrimmedCurve: typeof Geom_TrimmedCurve;
  Handle_Geom_TrimmedCurve: typeof Handle_Geom_TrimmedCurve;
  Handle_Geom_TrimmedCurve_1: typeof Handle_Geom_TrimmedCurve_1;
  Handle_Geom_TrimmedCurve_2: typeof Handle_Geom_TrimmedCurve_2;
  Handle_Geom_TrimmedCurve_3: typeof Handle_Geom_TrimmedCurve_3;
  Handle_Geom_TrimmedCurve_4: typeof Handle_Geom_TrimmedCurve_4;
  Geom_BoundedCurve: typeof Geom_BoundedCurve;
  Geom_BSplineCurve: typeof Geom_BSplineCurve;
  Geom_BSplineCurve_1: typeof Geom_BSplineCurve_1;
  Geom_BSplineCurve_2: typeof Geom_BSplineCurve_2;
  Handle_Geom_BSplineCurve: typeof Handle_Geom_BSplineCurve;
  Handle_Geom_BSplineCurve_1: typeof Handle_Geom_BSplineCurve_1;
  Handle_Geom_BSplineCurve_2: typeof Handle_Geom_BSplineCurve_2;
  Handle_Geom_BSplineCurve_3: typeof Handle_Geom_BSplineCurve_3;
  Handle_Geom_BSplineCurve_4: typeof Handle_Geom_BSplineCurve_4;
  Handle_Geom_BSplineSurface: typeof Handle_Geom_BSplineSurface;
  Handle_Geom_BSplineSurface_1: typeof Handle_Geom_BSplineSurface_1;
  Handle_Geom_BSplineSurface_2: typeof Handle_Geom_BSplineSurface_2;
  Handle_Geom_BSplineSurface_3: typeof Handle_Geom_BSplineSurface_3;
  Handle_Geom_BSplineSurface_4: typeof Handle_Geom_BSplineSurface_4;
  Geom_BSplineSurface: typeof Geom_BSplineSurface;
  Geom_BSplineSurface_1: typeof Geom_BSplineSurface_1;
  Geom_BSplineSurface_2: typeof Geom_BSplineSurface_2;
  Geom_Curve: typeof Geom_Curve;
  Handle_Geom_Curve: typeof Handle_Geom_Curve;
  Handle_Geom_Curve_1: typeof Handle_Geom_Curve_1;
  Handle_Geom_Curve_2: typeof Handle_Geom_Curve_2;
  Handle_Geom_Curve_3: typeof Handle_Geom_Curve_3;
  Handle_Geom_Curve_4: typeof Handle_Geom_Curve_4;
  Geom_ConicalSurface: typeof Geom_ConicalSurface;
  Geom_ConicalSurface_1: typeof Geom_ConicalSurface_1;
  Geom_ConicalSurface_2: typeof Geom_ConicalSurface_2;
  Geom_CylindricalSurface: typeof Geom_CylindricalSurface;
  Geom_CylindricalSurface_1: typeof Geom_CylindricalSurface_1;
  Geom_CylindricalSurface_2: typeof Geom_CylindricalSurface_2;
  Handle_Geom_Surface: typeof Handle_Geom_Surface;
  Handle_Geom_Surface_1: typeof Handle_Geom_Surface_1;
  Handle_Geom_Surface_2: typeof Handle_Geom_Surface_2;
  Handle_Geom_Surface_3: typeof Handle_Geom_Surface_3;
  Handle_Geom_Surface_4: typeof Handle_Geom_Surface_4;
  Geom_Surface: typeof Geom_Surface;
  Geom_Geometry: typeof Geom_Geometry;
  Geom_BezierCurve: typeof Geom_BezierCurve;
  Geom_BezierCurve_1: typeof Geom_BezierCurve_1;
  Geom_BezierCurve_2: typeof Geom_BezierCurve_2;
  Handle_Geom_BezierCurve: typeof Handle_Geom_BezierCurve;
  Handle_Geom_BezierCurve_1: typeof Handle_Geom_BezierCurve_1;
  Handle_Geom_BezierCurve_2: typeof Handle_Geom_BezierCurve_2;
  Handle_Geom_BezierCurve_3: typeof Handle_Geom_BezierCurve_3;
  Handle_Geom_BezierCurve_4: typeof Handle_Geom_BezierCurve_4;
  Geom_BoundedSurface: typeof Geom_BoundedSurface;
  BRepFilletAPI_MakeFillet: typeof BRepFilletAPI_MakeFillet;
  BRepFilletAPI_LocalOperation: typeof BRepFilletAPI_LocalOperation;
  BRepFilletAPI_MakeChamfer: typeof BRepFilletAPI_MakeChamfer;
  TopoDS_CompSolid: typeof TopoDS_CompSolid;
  TopoDS: typeof TopoDS;
  TopoDS_Vertex: typeof TopoDS_Vertex;
  TopoDS_Builder: typeof TopoDS_Builder;
  TopoDS_Shape: typeof TopoDS_Shape;
  TopoDS_Wire: typeof TopoDS_Wire;
  TopoDS_Shell: typeof TopoDS_Shell;
  TopoDS_Edge: typeof TopoDS_Edge;
  TopoDS_Face: typeof TopoDS_Face;
  TopoDS_Iterator: typeof TopoDS_Iterator;
  TopoDS_Iterator_1: typeof TopoDS_Iterator_1;
  TopoDS_Iterator_2: typeof TopoDS_Iterator_2;
  TopoDS_Solid: typeof TopoDS_Solid;
  TopoDS_Compound: typeof TopoDS_Compound;
  BRepMesh_DiscretRoot: typeof BRepMesh_DiscretRoot;
  BRepMesh_IncrementalMesh: typeof BRepMesh_IncrementalMesh;
  BRepMesh_IncrementalMesh_1: typeof BRepMesh_IncrementalMesh_1;
  BRepMesh_IncrementalMesh_2: typeof BRepMesh_IncrementalMesh_2;
  BRepMesh_IncrementalMesh_3: typeof BRepMesh_IncrementalMesh_3;
  TopLoc_Location: typeof TopLoc_Location;
  TopLoc_Location_1: typeof TopLoc_Location_1;
  TopLoc_Location_2: typeof TopLoc_Location_2;
  TopLoc_Location_3: typeof TopLoc_Location_3;
  ShapeUpgrade_UnifySameDomain: typeof ShapeUpgrade_UnifySameDomain;
  ShapeUpgrade_UnifySameDomain_1: typeof ShapeUpgrade_UnifySameDomain_1;
  ShapeUpgrade_UnifySameDomain_2: typeof ShapeUpgrade_UnifySameDomain_2;
};

declare function init(): Promise<OpenCascadeInstance>;

export default init;
