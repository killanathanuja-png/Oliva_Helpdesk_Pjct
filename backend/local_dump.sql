--
-- PostgreSQL database dump
--

\restrict QDNbl6iTvu03JkhBfFMplrQrNu7DH4UrBgvjqbsupe1SspffaZLexqADQwqQGdz

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approvalstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approvalstatusenum AS ENUM (
    'Pending',
    'Approved',
    'Rejected'
);


--
-- Name: commenttypeenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.commenttypeenum AS ENUM (
    'comment',
    'status_change',
    'approval'
);


--
-- Name: notificationtypeenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notificationtypeenum AS ENUM (
    'info',
    'warning',
    'success',
    'error'
);


--
-- Name: priorityenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priorityenum AS ENUM (
    'Critical',
    'High',
    'Medium',
    'Low'
);


--
-- Name: statusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.statusenum AS ENUM (
    'Active',
    'Inactive'
);


--
-- Name: ticketstatusenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticketstatusenum AS ENUM (
    'Open',
    'InProgress',
    'PendingApproval',
    'Resolved',
    'Closed',
    'Rejected',
    'Follow Up',
    'FollowUp',
    'Approved',
    'Acknowledged',
    'AwaitingUserInputs',
    'Awaiting User Inputs',
    'UserInputsReceived',
    'User Inputs Received'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    department_id integer,
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    module character varying(100)
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centers (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(150) NOT NULL,
    city character varying(100),
    state character varying(100),
    department character varying(100),
    contact_person character varying(100),
    phone character varying(20),
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    address character varying(300) DEFAULT NULL::character varying,
    pincode character varying(10) DEFAULT NULL::character varying,
    latitude character varying(20) DEFAULT NULL::character varying,
    longitude character varying(20) DEFAULT NULL::character varying,
    zone character varying(50) DEFAULT NULL::character varying,
    country character varying(50) DEFAULT 'India'::character varying,
    location_code character varying(20)
);


--
-- Name: centers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.centers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.centers_id_seq OWNED BY public.centers.id;


--
-- Name: child_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.child_categories (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(150) NOT NULL,
    subcategory_id integer,
    category_id integer,
    module character varying(100),
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: child_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.child_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: child_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.child_categories_id_seq OWNED BY public.child_categories.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    head character varying(100),
    sla_hours integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    status public.statusenum DEFAULT 'Active'::public.statusenum
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designations (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: designations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.designations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: designations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.designations_id_seq OWNED BY public.designations.id;


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    login_time timestamp with time zone DEFAULT now() NOT NULL,
    logout_time timestamp with time zone,
    duration_minutes integer,
    role character varying(100),
    module character varying(50),
    location character varying(100),
    login_source character varying(50),
    remarks character varying(500)
);


--
-- Name: login_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    message text,
    type public.notificationtypeenum,
    read boolean,
    ticket_id integer,
    user_id integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    status public.statusenum DEFAULT 'Active'::public.statusenum
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: service_titles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_titles (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    title character varying(200) NOT NULL,
    category_id integer NOT NULL,
    subcategory_id integer NOT NULL,
    priority public.priorityenum,
    sla_hours integer,
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: service_titles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_titles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_titles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_titles_id_seq OWNED BY public.service_titles.id;


--
-- Name: sla_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_configs (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    department_id integer NOT NULL,
    priority public.priorityenum NOT NULL,
    response_time_hrs double precision,
    resolution_time_hrs double precision,
    escalation_level1_hrs double precision,
    escalation_level2_hrs double precision,
    active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: sla_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sla_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sla_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sla_configs_id_seq OWNED BY public.sla_configs.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    category_id integer,
    status public.statusenum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_comments (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    "user" character varying(100),
    message text,
    type public.commenttypeenum,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_comments_id_seq OWNED BY public.ticket_comments.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    category character varying(100),
    sub_category character varying(100),
    priority public.priorityenum,
    status public.ticketstatusenum,
    raised_by_id integer NOT NULL,
    raised_by_dept character varying(100),
    assigned_to_id integer,
    assigned_dept character varying(100),
    center character varying(150),
    due_date timestamp with time zone,
    sla_breached boolean,
    approval_required boolean,
    approver character varying(100),
    approval_status public.approvalstatusenum,
    resolution text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    zenoti_location character varying(200),
    zenoti_main_category character varying(100),
    zenoti_sub_category character varying(100),
    zenoti_child_category character varying(100),
    zenoti_mobile_number character varying(20),
    zenoti_customer_id character varying(50),
    zenoti_customer_name character varying(100),
    zenoti_billed_by character varying(100),
    zenoti_invoice_no character varying(50),
    zenoti_invoice_date character varying(20),
    zenoti_amount character varying(50),
    zenoti_description text,
    approval_type character varying(50)
);


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role character varying(100),
    department_id integer,
    center_id integer,
    avatar character varying(10),
    status public.statusenum,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    employee_id character varying(30) DEFAULT NULL::character varying,
    designation character varying(100) DEFAULT NULL::character varying,
    gender character varying(10) DEFAULT NULL::character varying,
    mobile character varying(20) DEFAULT NULL::character varying,
    reporting_to character varying(100) DEFAULT NULL::character varying,
    map_level_access character varying(50) DEFAULT NULL::character varying,
    entity character varying(50) DEFAULT NULL::character varying,
    vertical character varying(50) DEFAULT NULL::character varying,
    costcenter character varying(50) DEFAULT NULL::character varying,
    grade character varying(50) DEFAULT NULL::character varying,
    employee_type character varying(50) DEFAULT NULL::character varying,
    city character varying(100),
    employee_dob character varying(30),
    employee_doj character varying(30),
    lwd character varying(30),
    effective_date character varying(30),
    remarks character varying(500)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: centers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers ALTER COLUMN id SET DEFAULT nextval('public.centers_id_seq'::regclass);


--
-- Name: child_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_categories ALTER COLUMN id SET DEFAULT nextval('public.child_categories_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: designations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations ALTER COLUMN id SET DEFAULT nextval('public.designations_id_seq'::regclass);


--
-- Name: login_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_history ALTER COLUMN id SET DEFAULT nextval('public.login_history_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: service_titles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_titles ALTER COLUMN id SET DEFAULT nextval('public.service_titles_id_seq'::regclass);


--
-- Name: sla_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_configs ALTER COLUMN id SET DEFAULT nextval('public.sla_configs_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: ticket_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN id SET DEFAULT nextval('public.ticket_comments_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, code, name, description, department_id, status, created_at, updated_at, module) FROM stdin;
25	Products	Products	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:17:51.772258+05:30	Feedback
31	Website	Website	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:19:38.668047+05:30	Feedback
30	TW	Twitter	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:19:57.941525+05:30	Feedback
18	FDBCK	Feedback	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:20:19.91945+05:30	Feedback
19	GFDBC	General Feedback Call	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:20:41.864646+05:30	Feedback
27	SFDBK	Service Feedback	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 17:08:43.668594+05:30	Feedback
17	FB	Facebook	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 17:09:32.908806+05:30	Feedback
13	BPM	BPM	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:04:14.914458+05:30	\N
28	SE	Support Emails	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:04:14.914458+05:30	\N
29	TSC	Treatment Satisfaction call	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:04:14.914458+05:30	\N
32	ZF	Zenoti-Finance	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:12:55.760027+05:30	Zenoti
33	ZO	Zenoti-Operational	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:13:03.905388+05:30	Zenoti
24	OI	Operational Issues	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:13:12.757038+05:30	Zenoti
20	GR	Google Review	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:13:37.888178+05:30	Feedback
16	FM	FM Call	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:14:12.710335+05:30	Helpdesk
26	SMS	SMS	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:16:18.509544+05:30	Feedback
23	MS	Mouthshut	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:16:38.71668+05:30	Feedback
15	DSATC	Dsat Complaints	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:17:10.352618+05:30	Feedback
14	BPME	BPM- Escalations	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:17:15.579116+05:30	Feedback
22	JD	Justdial	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:17:30.195888+05:30	Feedback
21	Info	Info	\N	\N	Active	2026-03-20 16:00:23.617125+05:30	2026-03-20 16:17:40.298389+05:30	Feedback
\.


--
-- Data for Name: centers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.centers (id, code, name, city, state, department, contact_person, phone, status, created_at, updated_at, address, pincode, latitude, longitude, zone, country, location_code) FROM stdin;
112	CGR	CG Road	Ahmedabad	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
113	BLR-ETC	Electronic City	Bengaluru	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	560100	\N	\N	South	India	\N
114	BLR-HSR	HSR Layout	Bengaluru	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N		India	\N
115	BLR-WHF	Whitefield	Bengaluru	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
116	Yelahanka	Yelahanka	Bengaluru	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
117	Chandigarh	Chandigarh	Chandigarh	\N	\N	\N	\N	Inactive	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
118	CHN-OMR	OMR	Chennai	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	2nd floor, Door No. 241 & 248 Part, Kumaran Nagar, Nookampalayam Road,, Old Mahabalipuram Salai Cross Street, Sholinganallur,, Chennai, Tamil Nadu	600119	\N	\N	\N	India	\N
119	COK	Kadvanthara	Cochin	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	Sreyas Holistic Remedies Pvt Ltd, Zodiac Square, Shop No.28/922J, 1st Floor,  Sahodaran Ayyappan Road, Kadavanthara,Kochi, Kerala 682020	682020	\N	\N		India	\N
120	DL-PNB	West Punjabi Bagh	Delhi	\N	\N	\N	\N	Inactive	2026-03-19 18:26:26.257709+05:30	\N	B, Ground Floor,2/80, Club Rd, beside Cloud Nine Hospital, West Punjabi Bagh, Punjabi Bagh,New Delhi, Delhi 110026.	\N	\N	\N	South	India	\N
121	DL-PTH	Preetvihar	Delhi	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	North	India	\N
122	GK	Greater Kailash 2	Delhi	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
123	PTM	Pitampura	Delhi	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	Pitampura	\N	\N	\N	West	India	\N
124	HYD-DSNR	Dilsukhnagar	Hyderabad	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	South	India	\N
125	HYD-JBH	Jubilee Hills	Hyderabad	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
126	KOK	Kokapet	Hyderabad	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
127	1234	Salk Lake	Kolkata	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
128	JODH	Jodhpur	Kolkata	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	700045	\N	\N	\N	India	\N
129	PS	Park Street	Kolkata	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
130	AUN	Aundh	Pune	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
131	KLN	Kalyaninagar	Pune	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	Ground Floor, Fortaleza Complex  Below Golds Gym, \nKalyani Nagar, Pune, Maharashtra 411014	411006	\N	\N	West	India	\N
132	PUN-KHD	Kharadi	Pune	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	411048	\N	\N	\N	India	\N
133	SHN	Shivaji Nagar	Pune	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N	\N	India	\N
134	VJA	Vijayawada	Vijayawada	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	520008	\N	\N	\N	India	\N
135	Dwaraka	Dwaraka Nagar	Vizag	\N	\N	\N	\N	Active	2026-03-19 18:26:26.257709+05:30	\N	\N	\N	\N	\N		India	\N
136	C136	Begumpet HO/HYD	Hyderabad		\N			Active	2026-03-20 14:30:46.28763+05:30	2026-03-20 14:44:37.008478+05:30						India	HYD-BGPHO
144	C144	Annanagar	Chennai		\N			Active	2026-03-22 22:12:13.472913+05:30	2026-03-22 22:14:40.27782+05:30						India	CHN-ANG
143	C143	Alwarpet	Chennai		\N			Active	2026-03-22 01:52:23.417303+05:30	2026-03-22 22:14:56.673168+05:30						India	CHN-ALW
142	C142	Adiyar	Chennai		\N			Active	2026-03-22 01:48:46.088319+05:30	2026-03-22 22:15:07.446079+05:30						India	CHN-ADR
141	C141	Sadashivnagar	Bengaluru		\N			Active	2026-03-22 01:45:55.15434+05:30	2026-03-22 22:15:16.910831+05:30						India	BLR-SDS
140	C140	Koramangala	Bengaluru		\N			Active	2026-03-22 01:42:51.070957+05:30	2026-03-22 22:15:27.99421+05:30						India	BLR-KRM
137	C137	Jayanagar	Bengaluru		\N			Active	2026-03-22 00:39:00.244035+05:30	2026-03-22 22:15:39.16861+05:30						India	BLR-JNG
139	C139	Indiranagar	Bengaluru		\N			Active	2026-03-22 01:36:42.178558+05:30	2026-03-22 22:16:00.414247+05:30						India	BLR-IND
138	C138	Pune	Pune		\N			Active	2026-03-22 01:29:25.629664+05:30	2026-03-22 22:16:50.368812+05:30						India	PUNE
145	C145	Kalyaninagar	Pune		\N			Inactive	2026-03-22 22:27:22.418191+05:30	2026-03-22 22:28:53.424034+05:30						India	PUNE-KN
146	C146	Gachibowli	Hyderabad		\N			Active	2026-03-22 23:19:37.845172+05:30	\N						India	HYD-GCBL
\.


--
-- Data for Name: child_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.child_categories (id, code, name, subcategory_id, category_id, module, status, created_at, updated_at) FROM stdin;
1	BPMTV	Treatment of Viral wart-Skin tumor & molluscum con	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
2	BPMTOS	Treatment of Scars	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
3	BPMTR	Tattoo removal	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
4	BPMTAN	TAN	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
5	BPMSAB	Subcision and biopsy	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
6	BPMSM	Stretchmarks	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
7	BPMSR	Skin Rejuvenation	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
8	BPMSP	Skin Polish	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
9	BPMPRP	PRP	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
10	BPMPD	Pigmentary disorders	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
11	BPMOW	Obesity-Weight loss	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
12	BPMILS	ILS	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
13	BPMHT	Hypertrichosis treatment	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
14	BPMHH	Hyperhydrosis	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
15	BPMH	Hirusitism	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
16	BPMCT	Consultation	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
17	BPMBC	Body Contouring	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
18	BPMBM	Birthmarks	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
19	BPMAA	Antiageing	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
20	BPMACP	ACP	480	13	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
21	FDBKTV	Treatment of Viral wart-Skin tumor & molluscum con	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
22	FDBKTOS	Treatment of Scars	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
23	FDBKTR	Tattoo removal	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
24	FDBKTAN	TAN	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
25	FDBKSAB	Subcision and biopsy	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
26	FDBKSM	Stretchmarks	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
27	FDBKSR	Skin Rejuvenation	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
28	FDBKSP	Skin Polish	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
29	FDBKPRP	PRP	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
30	FDBKPD	Pigmentary disorders	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
31	FDBKOW	Obesity-Weight loss	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
32	FDBKILS	ILS	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
33	FDBKHT	Hypertrichosis treatment	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
34	FDBKHH	Hyperhydrosis	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
35	FDBKH	Hirusitism	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
36	FDBKCT	Consultation	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
37	FDBKBC	Body Contouring	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
38	FDBKBM	Birthmarks	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
39	FDBKAA	Antiageing	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
40	ACPFDBK	ACP	480	18	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
41	TVWEB	Treatment of Viral wart-Skin tumor & molluscum con	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
42	TVTW	Treatment of Viral wart-Skin tumor & molluscum con	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
43	TVTSC	Treatment of Viral wart-Skin tumor & molluscum con	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
44	TVSE	Treatment of Viral wart-Skin tumor & molluscum con	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
45	TVSF	Treatment of Viral wart-Skin tumor & molluscum con	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
46	TVPROD	Treatment of Viral wart-Skin tumor & molluscum con	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
47	TVMS	Treatment of Viral wart-Skin tumor & molluscum con	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
48	TVGR	Treatment of Viral wart-Skin tumor & molluscum con	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
49	TVGFC	Treatment of Viral wart-Skin tumor & molluscum con	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
50	TVFB	Treatment of Viral wart-Skin tumor & molluscum con	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
51	TVDSAT	Treatment of Viral wart-Skin tumor & molluscum con	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
52	TVBPM	Treatment of Viral wart-Skin tumor & molluscum con	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
53	TOSWEB	Treatment of Scars	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
54	TOSTW	Treatment of Scars	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
55	TOSTSC	Treatment of Scars	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
56	TOSSE	Treatment of Scars	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
57	TOSSF	Treatment of Scars	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
58	TOSPROD	Treatment of Scars	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
59	TOSMS	Treatment of Scars	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
60	TOSGR	Treatment of Scars	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
61	TOSGFC	Treatment of Scars	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
62	TOSFB	Treatment of Scars	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
63	TOSDSAT	Treatment of Scars	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
64	TOSBPM	Treatment of Scars	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
65	TRWEB	Tattoo removal	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
66	TRTW	Tattoo removal	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
67	TRTSC	Tattoo removal	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
68	TRSE	Tattoo removal	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
69	TRSF	Tattoo removal	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
70	TRPROD	Tattoo removal	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
71	TRMS	Tattoo removal	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
72	TRGR	Tattoo removal	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
73	TRGFC	Tattoo removal	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
74	TRFB	Tattoo removal	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
75	TRDSAT	Tattoo removal	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
76	TRBPM	Tattoo removal	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
77	TANWEB	TAN	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
78	TANTW	TAN	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
79	TANTSC	TAN	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
80	TANSE	TAN	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
81	TANSF	TAN	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
82	TANPROD	TAN	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
83	TANMS	TAN	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
84	TANGR	TAN	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
85	TANGFC	TAN	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
86	TANFB	TAN	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
87	TANDSAT	TAN	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
88	TANBPM	TAN	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
89	SABWEB	Subcision and biopsy	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
90	SABTW	Subcision and biopsy	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
91	SABTSC	Subcision and biopsy	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
92	SABSE	Subcision and biopsy	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
93	SABSF	Subcision and biopsy	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
94	SABPROD	Subcision and biopsy	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
95	SABMS	Subcision and biopsy	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
96	SABGR	Subcision and biopsy	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
97	SABGFC	Subcision and biopsy	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
98	SABFB	Subcision and biopsy	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
99	SABDSAT	Subcision and biopsy	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
100	SABBPM	Subcision and biopsy	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
101	SMWEB	Stretchmarks	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
102	SMTW	Stretchmarks	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
103	SMTSC	Stretchmarks	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
104	SMSE	Stretchmarks	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
105	SMSF	Stretchmarks	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
106	SMPROD	Stretchmarks	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
107	SMMS	Stretchmarks	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
108	SMGR	Stretchmarks	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
109	SMGFC	Stretchmarks	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
110	SMFB	Stretchmarks	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
111	SMDSAT	Stretchmarks	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
112	SMBPM	Stretchmarks	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
113	SRWEB	Skin Rejuvenation	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
114	SRTW	Skin Rejuvenation	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
115	SRTSC	Skin Rejuvenation	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
116	SRSE	Skin Rejuvenation	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
117	SRSF	Skin Rejuvenation	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
118	SRPROD	Skin Rejuvenation	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
119	SRMS	Skin Rejuvenation	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
120	SRGR	Skin Rejuvenation	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
121	SRGFC	Skin Rejuvenation	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
122	SRFB	Skin Rejuvenation	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
123	SRDSAT	Skin Rejuvenation	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
124	SRBPM	Skin Rejuvenation	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
125	SPWEB	Skin Polish	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
126	SPTW	Skin Polish	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
127	SPTSC	Skin Polish	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
128	SPSE	Skin Polish	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
129	SPSF	Skin Polish	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
130	SPPROD	Skin Polish	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
131	SPMS	Skin Polish	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
132	SPGR	Skin Polish	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
133	SPGFC	Skin Polish	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
134	SPFB	Skin Polish	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
135	SPDSAT	Skin Polish	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
136	SPBPM	Skin Polish	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
137	PRPWEB	PRP	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
138	PRPTW	PRP	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
139	PRPTSC	PRP	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
140	PRPSE	PRP	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
141	PRPSF	PRP	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
142	PRPPROD	PRP	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
143	PRPMS	PRP	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
144	PRPGR	PRP	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
145	PRPGFC	PRP	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
146	PRPFB	PRP	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
147	PRPDSAT	PRP	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
148	PRPBPM	PRP	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
149	PDWEB	Pigmentary disorders	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
150	PDTW	Pigmentary disorders	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
151	PDTSC	Pigmentary disorders	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
152	PDSE	Pigmentary disorders	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
153	PDSF	Pigmentary disorders	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
154	PDPROD	Pigmentary disorders	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
155	PDMS	Pigmentary disorders	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
156	PDGR	Pigmentary disorders	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
157	PDGFC	Pigmentary disorders	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
158	PDFB	Pigmentary disorders	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
159	PDDSAT	Pigmentary disorders	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
160	PDBPM	Pigmentary disorders	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
161	OWWEB	Obesity-Weight loss	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
162	OWTW	Obesity-Weight loss	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
163	OWTSC	Obesity-Weight loss	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
164	OWSE	Obesity-Weight loss	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
165	OWSF	Obesity-Weight loss	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
166	OWPROD	Obesity-Weight loss	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
167	OWMS	Obesity-Weight loss	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
168	OWGR	Obesity-Weight loss	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
169	OWGFC	Obesity-Weight loss	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
170	OWFB	Obesity-Weight loss	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
171	OWDSAT	Obesity-Weight loss	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
172	OWBPM	Obesity-Weight loss	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
173	ILSWEB	ILS	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
174	ILSTW	ILS	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
175	ILSTSC	ILS	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
176	ILSSE	ILS	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
177	ILSSF	ILS	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
178	ILSPROD	ILS	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
179	ILSMS	ILS	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
180	ILSGR	ILS	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
181	ILSGFC	ILS	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
182	ILSFB	ILS	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
183	ILSDSAT	ILS	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
184	ILSBPM	ILS	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
185	HTWEB	Hypertrichosis treatment	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
186	HTTW	Hypertrichosis treatment	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
187	HTTSC	Hypertrichosis treatment	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
188	HTSE	Hypertrichosis treatment	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
189	HTSF	Hypertrichosis treatment	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
190	HTPROD	Hypertrichosis treatment	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
191	HTMS	Hypertrichosis treatment	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
192	HTGR	Hypertrichosis treatment	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
193	HTGFC	Hypertrichosis treatment	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
194	HTFB	Hypertrichosis treatment	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
195	HTDSAT	Hypertrichosis treatment	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
196	HTBPM	Hypertrichosis treatment	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
197	HHWEB	Hyperhydrosis	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
198	HHTW	Hyperhydrosis	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
199	HHTSC	Hyperhydrosis	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
200	HHSE	Hyperhydrosis	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
201	HHSF	Hyperhydrosis	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
202	HHPROD	Hyperhydrosis	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
203	HHMS	Hyperhydrosis	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
204	HHGR	Hyperhydrosis	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
205	HHGFC	Hyperhydrosis	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
206	HHFB	Hyperhydrosis	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
207	HHDSAT	Hyperhydrosis	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
208	HHBPM	Hyperhydrosis	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
209	HWEB	Hirusitism	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
210	HTW	Hirusitism	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
211	HTSC	Hirusitism	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
212	HSE	Hirusitism	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
213	HSF	Hirusitism	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
214	HPROD	Hirusitism	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
215	HMS	Hirusitism	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
216	HGR	Hirusitism	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
217	HGFC	Hirusitism	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
218	HFB	Hirusitism	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
219	HDSAT	Hirusitism	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
220	HBPM	Hirusitism	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
221	CWEB	Consultation	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
222	CTW	Consultation	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
223	CTSC	Consultation	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
224	CSE	Consultation	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
225	CSF	Consultation	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
226	CPROD	Consultation	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
227	CMS	Consultation	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
228	CTGR	Consultation	480	20	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
229	CGFC	Consultation	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
230	CFB	Consultation	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
231	CDSAT	Consultation	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
232	CBPM	Consultation	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
233	BCWEB	Body Contouring	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
234	BCTW	Body Contouring	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
235	BCTSC	Body Contouring	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
236	BCSE	Body Contouring	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
237	BCSF	Body Contouring	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
238	BCPROD	Body Contouring	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
239	BCMS	Body Contouring	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
240	BCGR	Body Contouring	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
241	BCGFC	Body Contouring	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
242	BCFB	Body Contouring	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
243	BCDSAT	Body Contouring	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
244	BCBPM	Body Contouring	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
245	BMWEB	Birthmarks	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
246	BMTW	Birthmarks	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
247	BMTSC	Birthmarks	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
248	BMSE	Birthmarks	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
249	BMSF	Birthmarks	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
250	BMPROD	Birthmarks	480	25	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
251	BM	Birthmarks	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
252	BMGR	Birthmarks	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
253	BMGFC	Birthmarks	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
254	BMFB	Birthmarks	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
255	BMDSAT	Birthmarks	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
256	BMBPM	Birthmarks	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
257	AAWEB	Antiageing	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
258	AATW	Antiageing	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
259	AATSC	Antiageing	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
260	AASE	Antiageing	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
261	AASF	Antiageing	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
262	AAPROD	Antiageing	480	25	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
263	AAMS	Antiageing	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
264	AAGR	Antiageing	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
265	AAGFC	Antiageing	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
266	AAFB	Antiageing	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
267	AADSAT	Antiageing	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
268	AABPM	Antiageing	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
269	ACPWEB	ACP	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
270	ACPTW	ACP	480	30	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
271	ACPTSC	ACP	480	29	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
272	ACPSE	ACP	480	28	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
273	ACPSF	ACP	480	27	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
274	ACPMS	ACP	480	23	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
275	ACPGR	ACP	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
276	ACPGFC	ACP	480	19	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
277	ACPFB	ACP	480	17	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
278	ACPDSAT	ACP	480	15	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
279	ACPBPM	ACP	480	14	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
280	ACP	ACP	480	31	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
281	Test	Testing	480	20	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
282	BPO	50% Off on a BWL Package	302	33	ZENOTI	Inactive	2026-03-20 19:55:56.280779+05:30	\N
283	FITP	1 Free Instaglow Treatment for Platinum	302	33	ZENOTI	Inactive	2026-03-20 19:55:56.280779+05:30	\N
284	PKBA	Product Kit on Birthday/Anniversary	302	33	ZENOTI	Inactive	2026-03-20 19:55:56.280779+05:30	\N
285	BSSE	B Session	103	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
286	UAC	Unable to apply campaign	142	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
287	CNV	Campaign not visible	142	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
288	FBPKGS	Soprano Ice Full Body Package	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
289	FBPKGC	Soprano Full Body Package	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
290	ECF	EMPL Complimentary Face	175	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
291	EFFBFD	EMPL Friends & Family 10%	175	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
292	EDFFDD	EMPL IMD Famliy 10%	175	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
293	EDFFD	EMPL IMD Family Discount 20%	175	33	ZENOTI	Inactive	2026-03-20 19:55:56.280779+05:30	\N
294	EIFD	EMPL IMD Family	175	33	ZENOTI	Inactive	2026-03-20 19:55:56.280779+05:30	\N
295	EDBF	EMPL IMD Family 15%	175	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
296	ED	EMPL Discount	175	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
297	CFOTH	Others	335	21	FEEDBACK	Active	2026-03-20 19:55:56.280779+05:30	\N
298	IABCOTH	Others	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
299	IABCBA	Not able to block appointment	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
300	IABCCS	Not able to Consume the session	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
301	UAEPOTH	Others	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
302	UAEPUP	Not able to Upload Pictures from CRT End	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
303	BOCFDPOTH	Others	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
304	BOCFDPOC	To bill the packages for Old clients	\N	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
305	PCGLPOTH	Others	338	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
306	PCGLPLVE	Loyalty Points Validity Extention	338	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
307	PCGLPGVE	Gift card Validity Extention	338	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
308	PCGLPCVE	Prepaid card Validity Extention	338	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
309	VEPOTH	Others	483	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
310	VEPPGE	Package Got Expired	483	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
311	REATOTH	Others	372	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
312	REATTE	Transfer Employee	372	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
313	REATAE	Adding new Employee	372	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
314	AUTHRA	Required Authentication	100	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
315	WRPRODUCTOTH	Others	512	32	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
316	WRPRODUCTUR	To Undo Refund	512	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
317	WRPOTH	Others	511	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
318	WRPUR	To Undo Refund	511	24	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
319	UPOTH	Others	482	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
320	UPMRP	Missed Closing Register for Products	143	33	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
321	UPMPKG	Missed closing Register for Package	143	33	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
322	UPPF	Package has been Freezed	482	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
323	OTPIRGC	Not able to redeem Gift Cards	333	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
324	OTPIRPC	Not able to redeem Prepaid Card	333	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
325	OTPIRLP	Not able to redeem Loyalty Points	333	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
326	LOYOTH	Others	302	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
327	LOYMEL	Missed to enroll into loyalty	302	33	HELPDESK	Inactive	2026-03-20 19:55:56.280779+05:30	\N
328	EPCOTH	Others	172	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
329	EPCDVN	Deleting the Voucher No	172	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
330	EPCED	Edit in Description	172	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
331	BCPOTH	Others	102	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
332	BCPGCP	Giving Complimentary Products due to various reasons	102	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
333	GCCOTH	Others	239	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
334	GCCTA	Transffering amount from one client to other client	239	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
335	BCSOTH	Others	103	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
336	BCSGCS	Giving Complimentary Sessions due to various reasons	103	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
337	PNUOTH	Others	342	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
338	PNUCW	Client Want to update/Change Mobile Number	342	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
339	WCOTH	Others	485	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
340	WCTHN	TH/Dr Name change in Consumption	485	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
341	WCCSAP	Consumed session from another Package	485	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
342	WCCT	Consumed Twice	485	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
343	DRNCOTH	Others	145	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
344	DRNCDRN	Dr name captured incorrectly	145	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
345	DRNCMCR	Missed Capturing Dr Refferal	145	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
346	INCPOTH	Others	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
347	INCPTHN	Th Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
348	INCPDRN	DR Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
349	INCPCRT	CRT Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
350	MNCPOTH	Others	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
351	MNCPTHN	Missed Capturing TH  name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
352	MNCPDRN	Missed Capturing Dr  name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
353	MNCPCRT	Missed Capturing CRT name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
354	INCPKGOTH	Others	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
355	INCPKGTHN	Th Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
356	INCPKGDRN	DR Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
357	INCPKGCRT	CRT Name Captured Incorrectly	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
358	MNCPKGOTH	Others	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
359	MNCPKGTHN	Missed Capturing TH  name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
360	MNCPKGDRN	Missed Capturing Dr  name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
361	MNCPKGCRT	Missed Capturing CRT name	\N	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
362	CNAOTH	Others	142	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
363	CNAMAC	Missed to apply Campaign	142	33	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
364	PBCOTH	Others	337	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
365	MPROTH	Others	305	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
366	MPRPRI	Package Refund Done Incorrectly	305	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
367	MPRPR	Not able to do Package Refund	305	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
368	ICAOTH	Others	288	32	HELPDESK	Inactive	2026-03-20 19:55:56.280779+05:30	\N
369	ICACS	Incorrect Campaign Selected	288	32	HELPDESK	Inactive	2026-03-20 19:55:56.280779+05:30	\N
370	REPOTH	Others	371	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
371	REPEAC	Excess Amount Collected By Custom	371	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
372	REPCARD	Excess Amount Collected by Card	371	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
373	REPCASH	Excess Amount Collected by Cash	371	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
374	PBCPBA	Product Billing during Audit	337	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
375	PBCWPS	Wrong Product Selected	337	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
376	PBCDBSINV	Double Billing of Same invoice	337	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
377	PBCBWCID	Billed in Wrong Client Id	337	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
378	BCOTH	Others	101	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
379	WPS	Wrong Package Selected	101	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
380	DBSINV	Double Billing of Same invoice	101	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
381	BWCID	Billed in Wrong Client Id	101	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
382	BDOTH	Others	104	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
383	MBOSD	Missed to bill on the Same day	104	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
384	PMOthers	Others	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
385	LoyaltyCash	Loyalty-Cash	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
386	LoyaltyPerpaid	Loyalty-Prepaid Card	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
387	CardPrepaid	Card-Prepaid Card	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
388	CashPrepaid	Cash-Prepaid Card	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
389	CashCustom	Cash-Custom	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
390	CardCustom	Card-Custom	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
391	CustomCard	Custom-Card	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
392	CardCash	Card-Cash	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
393	CC	Cash-Card	341	32	ZENOTI	Active	2026-03-20 19:55:56.280779+05:30	\N
394	CONF	Conference Hall booking	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
395	CAR	request for pick up  & drop, Machine shifting	\N	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
396	NLFT	New lights/furniture	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
397	RSLI	Reception shadow Lights	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
398	NTCH	New tables/chairs	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
399	WADA	Wallpaper damage	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
400	TGBN	Toughened Glass Broken	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
401	FLTI	Floor tiles	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
402	GRCE	Grid ceiling	343	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
403	WAOR	Others	484	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
404	GBCG	General garbbage collection	484	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
405	BWCO	Bio-waste collection	484	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
406	WAOT	Tally Software installation	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
407	GGCC	Billing Software installation	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
408	BWCL	CRM Application	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
409	TSWI	Others	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
410	BISW	Operating System	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
411	CRMA	Installation	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
412	SOTH	Application	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
413	OPST	Corel Draw Software	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
414	INST	Antivirus	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
415	APPL	Adobe	426	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
416	CDSW	Others	\N	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
417	ATVR	Uniform / Grooming	\N	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
418	ADBE	Man Power availability issues	\N	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
419	SESO	Theft incident	\N	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
420	UNGR	Others	370	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
421	MPAI	Structural Leakage/Damage	370	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
422	THIC	Others	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
423	REO	Z Trolley	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
424	SLDM	Pen Drive	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
425	PROT	Computer Table	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
426	ZTR	Round chair	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
427	PEDR	Clinic Stamp	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
428	COTB	Derm lite DL1 & Iphone 4 S	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
429	ROCH	Microwave	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
430	CLST	Refrigerator	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
431	DLIP	Mini Refrigerator	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
432	MIWV	Camera	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
433	RFRT	Dust Bin Steel Big	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
434	MIRE	Dust Bin Steel Small	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
435	CMRA	Dust Bin Steel leg	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
436	DBSB	Poster	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
437	DBSS	Sharp Container	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
438	DBSL	Needle Burner	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
439	PSTR	Green Bags 17X24 5KG	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
440	SHCO	Yellow Bags 17X24 5KG	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
441	BEBR	Red Bags 17X24 5KG	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
442	GRBS	Yellow bins 15LTS	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
443	YBGS	Red bins 15LTS	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
444	REBG	Normal Phone	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
445	YBLT	Mobile phone	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
446	RBLT	Electronics safety locker	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
447	NOPH	Crockery set & Cutlery Set, Mircrowave bowls	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
448	MOPH	Wireless Router	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
449	ESLK	Printer	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
450	CSMB	External HDD 1TB	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
451	WLRT	Laptop	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
452	PRTR	Systems	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
453	EX1T	Centrifuge	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
454	LPTP	Blankets	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
455	SYST	Bed Covers	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
456	CNTF	Bath robe	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
457	BLN	Back Peel gowns	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
458	BECO	Peel gowns	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
459	BARO	Peel towel L	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
460	BPGR	Peel towel M	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
461	PEG	Peel towel S	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
462	PTL	DustBin replacement	344	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
463	PTM	Others	340	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
464	PTS	Branding prints, goodie bags etc	340	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
465	DBR	Envelopes, Letterheads & Forms	340	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
466	PRO	Others	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
467	BPG	Bad Odour	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
468	ELF	restroom tissues dispenser	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
469	PWO	Rest room hand dryers	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
470	BAO	Washbasin Replace / Repair	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
471	RTD	Tissues paper roll holder	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
472	RRH	W/C Replace / Repair	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
473	TPR	Water leakages	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
474	WRR	restroom flush issues	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
475	RES	restroom sink	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
476	RRT	Rest Room Towels Hanger fitting	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
477	PLF	Plumbing Fixtures	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
478	PTI	Pipes & Taps issues	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
479	HFH	Health Faucet holder	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
480	HEW	Health Faucet water pressure	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
481	HFR	Health Faucet Repair	368	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
482	PEO	Others	339	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
483	ROT	Rodent Treatment (Gum Pad Placement)	339	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
484	SCM	Spray for cockroach & flies & MosquitoesÂ	339	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
485	PAO	Others	367	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
486	REI	Refrigerator issues	367	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
487	MIO	Microwave Oven	367	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
488	COM	Coffee Machine	367	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
489	PAR	Paint removal	336	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
490	PEI	Paint new/ existing interiors	336	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
491	WCS	Apply wall coverings, coatings, and spray finishes	336	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
492	PTU	Painting Touch-up	336	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
493	OAO	Others	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
494	BMI	Bio Matrix issues	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
495	NSM	Newspapers & Magazines	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
496	IDC	ID Cards	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
497	VPT	Valet parking Tag requirement	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
498	VPD	Valet Parking driver issues	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
499	CAC	Carpet cleaning	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
500	WPI	Water purifier issues	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
501	SOW	Sofa Washing	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
502	SOR	Sofa Repairs	332	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
503	NEO	Others	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
504	OLC	Outlook configration	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
505	EMC	Email configration	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
506	ESI	Email Storage issues	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
507	WIF	Wifi	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
508	SEV	Server	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
509	LAN	LAN	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
510	INT	Internet	331	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
511	HAO	Others	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
512	PTD	Printer Toner & Drum	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
513	DTC	Data Card	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
514	MMP	Mouse, Mouse-pad	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
515	KEB	Keyboard	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
516	SCN	Scanner	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
517	PRN	Printer	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
518	COP	Computer Peripherals	286	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
519	EQO	Others	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
520	LAR	Lamp replacement	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
521	WFR	Water filter replacement	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
522	ILI	Inter Lens isses	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
523	WLI	Window Lens issues	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
524	MFI	MDA filter issue	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
525	MWP	Machine wheels problem	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
526	HHR	Hand piece holder replacement	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
527	HPS	Hand piece shifting	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
528	HPR	Hand piece "O" replacement	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
529	PCP	Power cord problem	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
530	CGR	Client Goggle requirment	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
531	GOR	Goggle requirment	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
532	WAF	Water filling	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
533	MAS	Machine shfting	176	16	HELPDESK	Inactive	2026-03-20 19:55:56.280779+05:30	\N
534	TSI	Tips Issues	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
535	FDI	Foot Pedal Issues	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
536	WAL	Water Leakage	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
537	HPE	Hand piece Error	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
538	DSE	Display error	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
539	ENW	Not working	176	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
540	EMO	Others	174	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
541	CAE	Cable Wiring	174	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
542	FES	Fire Extingusher servicing	174	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
543	FII	Fire Incident	174	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
544	FSC	Electrical Short Circuit	174	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
545	ELO	Others	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
546	EFR	Exhaust fans repair	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
547	IMI	Internet Modam issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
548	LWS	Low Speed	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
549	INI	Internet Issue	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
550	DCI	Data Card issue	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
551	TEW	Telephone wire replacement	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
552	NLI	New Line installation	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
553	EPR	EPABX Repair	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
554	TER	Telephone Repair	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
555	BZI	Buzzers issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
556	MCI	MCB issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
557	SBI	Switch board issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
558	SBN	Sign board light not working	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
559	CLW	CFL light not working	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
560	LLW	LED light not working	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
561	FAR	Fan repairs	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
562	FWP	Fans not working pantry	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
563	SCIS	Speaker controler issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
564	SPP	Speaker problem	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
565	MUST	Music System	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
566	SDR	Smoke detector replacement	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
567	SDNB	Smoke detector not blinking	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
568	LBEP	Low Battery Error from Panel	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
569	BSEA	Beep Sound from Alarm	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
570	FAPN	Fire Alarm panel not working	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
571	CCC	CCTV Camera	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
572	BUIS	Back up Issues	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
573	BERT	Battery replacement	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
574	UPSM	UPS smell  issue	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
575	UPER	UPS error / repair	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
576	STZR	Stabilizers	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
577	PROJ	Projectors	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
578	NSAM	Not switching ON in auto mode	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
579	EOLK	Engine Oil leakage	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
580	COLK	Coolent Leakage	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
581	SEDU	Servicing Due	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
582	LOBT	Low Battery	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
583	GSON	Generators not switching ON	173	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
584	DWRR	Damage wall repair	141	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
585	TIWK	Tiles Work	141	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
586	BRWL	Brick Walls	141	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
587	POWK	POP works	141	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
588	WIBE	Window Blands replacement	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
589	WBR	Window Blands Repair	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
590	WASK	Wall skirting	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
591	PHFT	Photo Frames Fitting	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
592	CAOR	Others	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
593	KBTY	keyboard trays	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
594	FUFN	Furniture finishing	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
595	CHIS	Chair Hydric issues	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
596	CHWL	Chair wheels	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
597	TBLS	Tables	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
598	FTRT	Footrest	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
599	GDH	Glass door handle	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
600	GCRP	Glass Cupboards replacement	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
601	GFIS	Glass fitting issues	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
602	GDIS	Glass doors issues	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
603	WODD	Wooden doors	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
604	KESP	Key set replacment	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
605	KSRP	Key set repair	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
606	CBCL	Cupboards channel	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
607	CBHI	Cupboards Hinges	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
608	CBUH	Cupboards handle	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
609	CUBS	Cupboards	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
610	COWK	Complete Woodworks	138	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
611	AIOH	Others	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
612	FICL	Filter cleaning	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
613	BAOD	Bad Odour	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
614	NAF	No air flow	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
615	ESIU	Excessive sound from indoor unit	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
616	WLIU	Water Leakage from indoor unit	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
617	RHA	Remote holder not available	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
618	RMNW	Remote not working	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
619	UHC	Uneven Heating or Cooling	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
620	EXLC	Excessive / less cooling	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
621	CNIS	Cooling is not sufficiant	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
622	NSWO	Not Switching ON	98	16	HELPDESK	Active	2026-03-20 19:55:56.280779+05:30	\N
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, code, name, head, sla_hours, created_at, updated_at, status) FROM stdin;
35	D002	Zenoti		24	2026-03-19 17:00:29.193321+05:30	\N	Active
36	D003	HR		24	2026-03-19 17:00:29.193321+05:30	\N	Active
37	D004	Clinic		24	2026-03-19 17:00:29.193321+05:30	\N	Active
38	D005	Quality		24	2026-03-19 17:00:29.193321+05:30	\N	Active
39	D006	Stores		24	2026-03-19 17:00:29.193321+05:30	\N	Active
40	D007	Products		24	2026-03-19 17:00:29.193321+05:30	\N	Active
42	D042	Accounts		24	2026-03-19 19:30:30.440425+05:30	\N	Active
43	D043	Marketing		24	2026-03-19 19:31:09.637295+05:30	\N	Active
45	D045	Digital Marketing		24	2026-03-19 19:31:55.175966+05:30	\N	Active
46	D046	Training Team		24	2026-03-19 19:32:42.397432+05:30	\N	Active
41	D008	Admin Department		24	2026-03-19 17:00:29.193321+05:30	2026-03-19 19:39:02.027382+05:30	Active
34	D001	IT Department		24	2026-03-19 17:00:29.193321+05:30	2026-03-19 19:39:50.238218+05:30	Active
44	D044	BPM Team		24	2026-03-19 19:31:38.180695+05:30	2026-03-19 19:40:38.264581+05:30	Active
47	D047	Travel Desk		24	2026-03-19 19:41:34.3802+05:30	\N	Active
49	D048	Clinic Operations		24	2026-03-20 11:09:40.669585+05:30	\N	Active
51	D051	Administration		24	2026-03-22 23:29:13.781006+05:30	\N	Active
\.


--
-- Data for Name: designations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.designations (id, code, name, status, created_at, updated_at) FROM stdin;
1	DG001	Account Incharge	Active	2026-03-19 20:25:01.266637+05:30	\N
2	DG002	Admin Member	Active	2026-03-19 20:25:01.266637+05:30	\N
3	DG003	Administration	Active	2026-03-19 20:25:01.266637+05:30	\N
4	DG004	Area Operations Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
5	DG005	BPM Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
6	DG006	Clinic Incharge	Active	2026-03-19 20:25:01.266637+05:30	\N
7	DG007	Clinic Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
8	DG008	Digital Marketing Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
9	DG009	FOE	Active	2026-03-19 20:25:01.266637+05:30	\N
10	DG010	HR Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
11	DG011	IT ADMIN	Active	2026-03-19 20:25:01.266637+05:30	\N
12	DG012	Marketing Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
13	DG013	Projects Team	Active	2026-03-19 20:25:01.266637+05:30	\N
14	DG014	Stores Incharge	Active	2026-03-19 20:25:01.266637+05:30	\N
15	DG015	Training Team Manager	Active	2026-03-19 20:25:01.266637+05:30	\N
16	DG016	Travel Desk Incharge	Active	2026-03-19 20:25:01.266637+05:30	\N
\.


--
-- Data for Name: login_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.login_history (id, user_id, login_time, logout_time, duration_minutes, role, module, location, login_source, remarks) FROM stdin;
1	708	2026-03-23 01:21:09.458956+05:30	2026-03-23 01:21:50.388944+05:30	0	Clinic Manager	General		Web browser	\N
2	699	2026-03-23 01:22:13.540574+05:30	2026-03-23 01:23:04.702077+05:30	0	QA	General		Web browser	\N
3	699	2026-03-23 01:23:26.637955+05:30	2026-03-23 01:23:52.233985+05:30	0	QA	General		Web browser	\N
4	698	2026-03-23 01:24:47.851942+05:30	2026-03-23 01:25:40.032766+05:30	0	Super Admin	General		Web browser	\N
5	703	2026-03-23 01:25:48.694576+05:30	2026-03-23 01:32:03.419956+05:30	6	Global Admin	General		Web browser	\N
6	703	2026-03-23 01:25:48.694576+05:30	2026-03-23 01:32:03.419956+05:30	6	Help Desk Admin	Helpdesk		Web browser	\N
7	703	2026-03-23 01:25:48.694576+05:30	2026-03-23 01:32:03.419956+05:30	6	Helpdesk In-charge	Helpdesk		Web browser	\N
8	703	2026-03-23 01:25:48.694576+05:30	2026-03-23 01:32:03.419956+05:30	6	L1 Manager	Helpdesk		Web browser	\N
9	703	2026-03-23 01:25:48.694576+05:30	2026-03-23 01:32:03.419956+05:30	6	Super User	General		Web browser	\N
10	736	2026-03-23 01:32:17.799946+05:30	2026-03-23 01:35:01.176475+05:30	2	Area Operations Manager	General	Whitefield	Web browser	\N
11	698	2026-03-23 01:35:03.152608+05:30	2026-03-23 01:39:44.267863+05:30	4	Super Admin	General		Web browser	\N
12	703	2026-03-23 01:40:00.454147+05:30	2026-03-23 01:40:23.948645+05:30	0	Global Admin	General		Web browser	\N
13	703	2026-03-23 01:40:00.454147+05:30	2026-03-23 01:40:23.948645+05:30	0	Help Desk Admin	Helpdesk		Web browser	\N
14	703	2026-03-23 01:40:00.454147+05:30	2026-03-23 01:40:23.948645+05:30	0	Helpdesk In-charge	Helpdesk		Web browser	\N
15	703	2026-03-23 01:40:00.454147+05:30	2026-03-23 01:40:23.948645+05:30	0	L1 Manager	Helpdesk		Web browser	\N
16	703	2026-03-23 01:40:00.454147+05:30	2026-03-23 01:40:23.948645+05:30	0	Super User	General		Web browser	\N
17	698	2026-03-23 01:40:26.189484+05:30	2026-03-23 01:43:59.879682+05:30	3	Super Admin	General		Web browser	\N
18	708	2026-03-23 01:44:34.834471+05:30	2026-03-23 01:45:30.041413+05:30	0	Clinic Manager	General		Web browser	\N
19	708	2026-03-23 01:45:53.558142+05:30	\N	\N	Clinic Manager	General		Web browser	\N
21	705	2026-03-23 12:33:50.832991+05:30	2026-03-23 12:34:08.660832+05:30	1	Area Operations Manager	General		Web browser	\N
20	698	2026-03-23 01:46:08.256415+05:30	2026-03-23 12:50:24.063169+05:30	664	Super Admin	General		Web browser	\N
22	698	2026-03-23 12:34:10.809785+05:30	2026-03-23 12:50:24.063169+05:30	16	Super Admin	General		Web browser	\N
23	714	2026-03-23 12:50:31.078587+05:30	2026-03-23 12:52:28.060533+05:30	1	Employee	General	Yelahanka	Web browser	\N
24	855	2026-03-23 12:52:47.581328+05:30	2026-03-23 13:01:00.830905+05:30	8	Area Operations Manager	General	Begumpet HO/HYD	Web browser	\N
25	855	2026-03-23 12:52:47.581328+05:30	2026-03-23 13:01:00.830905+05:30	8	Area Operations Manager Head	General	Begumpet HO/HYD	Web browser	\N
26	804	2026-03-23 13:01:14.410888+05:30	2026-03-23 13:02:53.076346+05:30	1	Finance Head	General		Web browser	\N
27	698	2026-03-23 13:02:54.677397+05:30	2026-03-23 13:32:06.701992+05:30	29	Super Admin	General		Web browser	\N
28	856	2026-03-23 13:32:14.658284+05:30	2026-03-23 13:32:18.333344+05:30	1	Employee	General	Begumpet HO/HYD	Web browser	\N
29	698	2026-03-23 13:32:23.256951+05:30	2026-03-23 13:34:42.42578+05:30	2	Super Admin	General		Web browser	\N
30	856	2026-03-23 13:34:55.431147+05:30	2026-03-23 13:35:13.039308+05:30	1	Others	General	Begumpet HO/HYD	Web browser	\N
31	856	2026-03-23 13:34:55.431147+05:30	2026-03-23 13:35:13.039308+05:30	1	Employee	General	Begumpet HO/HYD	Web browser	\N
32	698	2026-03-23 13:35:14.922152+05:30	2026-03-23 13:37:38.047427+05:30	2	Super Admin	General		Web browser	\N
33	698	2026-03-23 13:38:19.477092+05:30	2026-03-23 13:38:30.092854+05:30	1	Super Admin	General		Web browser	\N
34	705	2026-03-23 13:38:37.247627+05:30	2026-03-23 13:39:11.224565+05:30	1	Area Operations Manager	General		Web browser	\N
35	731	2026-03-23 13:40:22.635644+05:30	2026-03-23 13:42:12.501687+05:30	1	Area Operations Manager	General		Web browser	\N
36	808	2026-03-23 13:42:20.044523+05:30	2026-03-23 13:42:48.845548+05:30	1	Area Operations Manager	General		Web browser	\N
37	808	2026-03-23 13:42:20.044523+05:30	2026-03-23 13:42:48.845548+05:30	1	Area Operations Manager Head	General		Web browser	\N
38	808	2026-03-23 13:42:20.044523+05:30	2026-03-23 13:42:48.845548+05:30	1	Employee	General		Web browser	\N
39	698	2026-03-23 13:42:50.968071+05:30	2026-03-23 14:13:35.401693+05:30	30	Super Admin	General		Web browser	\N
40	705	2026-03-23 14:13:49.873335+05:30	2026-03-23 14:13:57.342616+05:30	1	Area Operations Manager	General		Web browser	\N
41	698	2026-03-23 14:14:03.985239+05:30	2026-03-23 14:16:16.891866+05:30	2	Super Admin	General		Web browser	\N
42	698	2026-03-23 14:16:28.548088+05:30	2026-03-23 14:17:36.663922+05:30	1	Super Admin	General		Web browser	\N
43	855	2026-03-23 14:17:47.576546+05:30	2026-03-23 14:17:57.028019+05:30	1	Area Operations Manager	General	Begumpet HO/HYD	Web browser	\N
44	855	2026-03-23 14:17:47.576546+05:30	2026-03-23 14:17:57.028019+05:30	1	Area Operations Manager Head	General	Begumpet HO/HYD	Web browser	\N
45	804	2026-03-23 14:18:11.561489+05:30	2026-03-23 14:18:25.302601+05:30	1	Finance Head	General		Web browser	\N
46	698	2026-03-23 14:18:41.235027+05:30	2026-03-23 14:18:56.796141+05:30	1	Super Admin	General		Web browser	\N
47	854	2026-03-23 14:19:05.527124+05:30	2026-03-23 14:24:19.049341+05:30	5	Zenoti Team	General		Web browser	\N
48	698	2026-03-23 14:24:21.660221+05:30	2026-03-23 14:26:34.770343+05:30	2	Super Admin	General		Web browser	\N
49	856	2026-03-23 14:26:48.396351+05:30	2026-03-23 14:39:13.416817+05:30	12	Super User	General	Begumpet HO/HYD	Web browser	\N
50	698	2026-03-23 14:39:15.62682+05:30	2026-03-23 14:47:01.037253+05:30	7	Super Admin	General		Web browser	\N
51	698	2026-03-23 14:47:08.191473+05:30	2026-03-23 14:47:34.97859+05:30	1	Super Admin	General		Web browser	\N
52	735	2026-03-23 14:47:42.216664+05:30	2026-03-23 14:51:29.033786+05:30	3	Employee	General	Whitefield	Web browser	\N
53	855	2026-03-23 14:52:53.118462+05:30	2026-03-23 14:54:20.071587+05:30	1	Area Operations Manager	General	Begumpet HO/HYD	Web browser	\N
54	855	2026-03-23 14:52:53.118462+05:30	2026-03-23 14:54:20.071587+05:30	1	Area Operations Manager Head	General	Begumpet HO/HYD	Web browser	\N
55	804	2026-03-23 14:54:49.512873+05:30	2026-03-23 14:55:20.220629+05:30	1	Finance Head	General		Web browser	\N
56	804	2026-03-23 14:56:01.304877+05:30	2026-03-23 14:56:48.94021+05:30	1	Finance Head	General		Web browser	\N
57	854	2026-03-23 14:57:14.172005+05:30	2026-03-23 15:17:46.165806+05:30	20	Zenoti Team	General		Web browser	\N
58	804	2026-03-23 15:18:06.849115+05:30	2026-03-23 15:20:08.415255+05:30	2	Finance Head	General		Web browser	\N
59	735	2026-03-23 15:20:23.797294+05:30	2026-03-23 15:20:55.882661+05:30	1	Employee	General	Whitefield	Web browser	\N
60	735	2026-03-23 15:21:21.308156+05:30	2026-03-23 15:24:37.704512+05:30	3	Employee	General	Whitefield	Web browser	\N
61	855	2026-03-23 15:25:15.612623+05:30	2026-03-23 15:25:55.859904+05:30	1	Area Operations Manager	General	Begumpet HO/HYD	Web browser	\N
62	855	2026-03-23 15:25:15.612623+05:30	2026-03-23 15:25:55.859904+05:30	1	Area Operations Manager Head	General	Begumpet HO/HYD	Web browser	\N
63	735	2026-03-23 15:26:36.197534+05:30	\N	\N	Employee	General	Whitefield	Web browser	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, title, message, type, read, ticket_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, name, description, permissions, created_at, updated_at, status) FROM stdin;
26	R004	Area Operations Manager Head	Head of area operations. Oversees all AOMs.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports", "Manage Centers", "Manage Team"]	2026-03-20 02:24:07.237848+05:30	\N	Active
27	R005	Clinic Incharge	In charge of clinic operations at center level.	["Manage Tickets", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
28	R006	Clinic Manager	Manages clinic operations and staff.	["View Dashboard", "Manage Tickets", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
30	R008	Finance	Finance team. Handles financial approvals.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
31	R009	Finance Head	Head of finance. Final financial approval authority.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports", "Manage Team"]	2026-03-20 02:24:07.237848+05:30	\N	Active
32	R010	Help Desk Admin	Help desk administrator. Manages ticket routing and resolution.	["View Dashboard", "Manage Tickets", "Resolve Tickets", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
33	R011	Helpdesk In-charge	In charge of help desk operations.	["View Dashboard", "Manage Tickets", "Resolve Tickets", "View Reports", "Manage Team"]	2026-03-20 02:24:07.237848+05:30	\N	Active
34	R012	L1 Manager	Level 1 manager. First escalation point.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
35	R013	L2 Manager	Level 2 manager. Second escalation point.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
23	R001	Super Admin	Full system access. Can manage all settings, users, and configurations.	["View Dashboard", "Manage Tickets", "View Reports", "Manage Users", "Manage Departments", "Manage Roles", "Manage Centers", "Manage SLA", "Manage Categories", "Manage Subcategories", "Manage Service Titles"]	2026-03-20 02:24:07.237848+05:30	\N	Active
24	R002	Global Admin	Global administrator with full system access.	["View Dashboard", "Manage Tickets", "View Reports", "Manage Users", "Manage Departments", "Manage Roles", "Manage Centers", "Manage SLA"]	2026-03-20 02:24:07.237848+05:30	\N	Active
25	R003	Area Operations Manager	Oversees operations across centers in assigned area.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports", "Manage Centers"]	2026-03-20 02:24:07.237848+05:30	\N	Active
36	R014	Manager	Department-level management. Can approve tickets and manage team.	["View Dashboard", "Manage Tickets", "Approve Requests", "View Reports", "Manage Team"]	2026-03-20 02:24:07.237848+05:30	\N	Active
37	R015	Others	Other role with basic access.	["Raise Ticket", "Track Own Tickets"]	2026-03-20 02:24:07.237848+05:30	\N	Active
38	R016	QA	Quality assurance team member.	["Manage Tickets", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
39	R017	Super User	Super user with elevated access.	["View Dashboard", "Manage Tickets", "View Reports", "Manage Users"]	2026-03-20 02:24:07.237848+05:30	\N	Active
40	R018	Zenoti Team	Zenoti team. Reviews and closes approved requests after making corrections.	["View Dashboard", "Manage Tickets", "Resolve Tickets", "View Reports"]	2026-03-20 02:24:07.237848+05:30	\N	Active
29	R007	Employee	Regular employee. Can raise and track tickets,manage tickets.	["Raise Ticket", "Track Own Tickets"]	2026-03-20 02:24:07.237848+05:30	2026-03-23 13:34:29.589999+05:30	Active
\.


--
-- Data for Name: service_titles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_titles (id, code, title, category_id, subcategory_id, priority, sla_hours, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sla_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sla_configs (id, code, department_id, priority, response_time_hrs, resolution_time_hrs, escalation_level1_hrs, escalation_level2_hrs, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcategories (id, code, name, category_id, status, created_at, updated_at) FROM stdin;
135	BPMOTH	BPM - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
117	BPMEFDB	BPM Escalation - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
118	BPMEHI	BPM Escalation - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
119	BPMEL	BPM Escalation - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
120	BPMELP	BPM Escalation - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
302	LOY	Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
121	BPMEN	BPM Escalation - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
122	BPMEO	BPM Escalation - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
123	BPMEOS	BPM Escalation - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
124	BPMEP	BPM Escalation - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
125	BPMEPR	BPM Escalation - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
126	BPMEPS	BPM Escalation - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
127	BPMERF	BPM Escalation - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
128	BPMERS	BPM Escalation - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
129	BPMEST	BPM Escalation - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
130	BPMET	BPM Escalation - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
131	BPMETMT	BPM Escalation - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
132	BPMEWT	BPM Escalation - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
133	BPMEpq	BPM Escalation - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
134	BPMFDB	BPM - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
136	BPMT	BPM - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
137	BPMTFT	BPM - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
138	CAR	Carpentry Service	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
139	CAS	Change of Address	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
140	CC	Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
141	CIW	Civil Works	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
142	CNA	Campaign Not Applied	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
143	CPDEND	Close payments/Day end not Done	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
144	DRB	Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
145	DRNC	Dr Refferal Not Captured	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
146	DSATCAC	Dsat - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
147	DSATCAO	Dsat - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
148	DSATCAR	Dsat - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
149	DSATCAT	Dsat - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
150	DSATCCC	Dsat - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
151	DSATCCRT	Dsat - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
152	DSATCDR	Dsat - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
153	DSATCDRB	Dsat - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
154	DSATCFDB	Dsat - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
155	DSATCHI	Dsat - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
156	DSATCL	Dsat - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
157	DSATCLP	Dsat - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
158	DSATCN	Dsat - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
159	DSATCO	Dsat - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
160	DSATCOS	Dsat - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
161	DSATCP	Dsat - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
162	DSATCPQ	Dsat - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
163	DSATCPR	Dsat - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
164	DSATCPS	Dsat - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
165	DSATCRF	Dsat - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
166	DSATCRS	Dsat - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
167	DSATCST	Dsat - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
168	DSATCT	Dsat - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
169	DSATCTMT	Dsat - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
170	DSATCWT	Dsat - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
171	DrBehaviour	Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
172	ECA	Edits In Petty Cash	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
173	ELS	Electrical Services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
174	EMS	Emergency Service	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
175	EPC	Employee/Friends/Family Campaign	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
176	EQU	Equipment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
177	Expriy	Expriy	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
178	FBAC	Facebook - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
179	FBAO	Facebook - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
180	FBAR	Facebook - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
181	FBAT	Facebook - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
182	FBC	Facebook - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
183	FBCC	Facebook - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
184	FBCRT	Facebook - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
185	FBDR	Facebook - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
186	FBDRB	Facebook - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
187	FBFDB	Facebook - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
188	FBHI	Facebook - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
189	FBL	Facebook - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
190	FBLP	Facebook - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
191	FBN	Facebook - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
192	FBOS	Facebook - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
193	FBOTH	Facebook - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
194	FBP	Facebook - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
195	FBPKG	Facebook - Full Body Package	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
196	FBPQ	Facebook - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
197	FBPR	Facebook - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
198	FBPS	Facebook - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
199	FBRF	Facebook - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
200	FBRS	Facebook - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
201	FBST	Facebook - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
202	FBT	Facebook - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
203	FBTFT	Facebook - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
204	FBWT	Facebook - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
205	FDB	FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
206	FDBKAC	Feedback - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
207	FDBKAO	Feedback - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
208	FDBKAR	Feedback - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
209	FDBKCC	Feedback - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
210	FDBKCRT	Feedback - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
211	FDBKDR	Feedback - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
212	FDBKDRB	Feedback - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
213	FDBKFDB	Feedback - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
214	FDBKHI	Feedback - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
215	FDBKLP	Feedback - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
216	FDBKLT	Feedback - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
217	FDBKNC	Feedback - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
218	FDBKOS	Feedback - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
219	FDBKOTH	Feedback - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
220	FDBKPQ	Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
221	FDBKPR	Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
222	FDBKPROD	Feedback - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
223	FDBKPS	Feedback - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
224	FDBKRF	Feedback - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
225	FDBKRS	Feedback - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
226	FDBKST	Feedback - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
227	FDBKT	Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
228	FDBKTFT	Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
229	FDBKWT	Feedback - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
230	FDBehaviour	FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
231	FEEDCOF	Disappointing Response on Ezconnect	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
232	FEEDDS	Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
233	FEEDOT	Appointment convenience	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
234	FEEDOTRS	Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
235	FEEDWPO	Wrong products ordered	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
236	FEEDWPR	Wrong products received	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
237	FOTH	FM Call - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
238	GAT	Gift Card Creation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
239	GCC	Gift Card Creation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
240	GFDBCAC	General Feedback - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
241	GFDBCAO	General Feedback - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
242	GFDBCAR	General Feedback - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
243	GFDBCAT	General Feedback - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
244	GFDBCCC	General Feedback - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
245	GFDBCCRT	General Feedback - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
246	GFDBCDRB	General Feedback - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
247	GFDBCFDB	General Feedback - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
248	GFDBCHI	General Feedback - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
249	GFDBCL	General Feedback - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
250	GFDBCLP	General Feedback - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
251	GFDBCN	General Feedback - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
252	GFDBCO	General Feedback - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
253	GFDBCOS	General Feedback - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
254	GFDBCP	General Feedback - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
255	GFDBCPQ	General Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
256	GFDBCPR	General Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
257	GFDBCPS	General Feedback - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
258	GFDBCRF	General Feedback - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
259	GFDBCRS	General Feedback - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
260	GFDBCST	General Feedback - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
261	GFDBCT	General Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
262	GFDBCTMT	General Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
263	GFDBCWT	General Feedback - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
264	GRAC	Google Review - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
265	GRAO	Google Review - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
266	GRAR	Google Review - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
267	GRCC	Google Review - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
268	GRCRT	Google Review - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
269	GRDR	Google Review - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
270	GRDRB	Google Review - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
271	GRFDB	Google Review - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
272	GRHI	Google Review - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
273	GRL	Google Review - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
274	GRLP	Google Review - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
275	GROS	Google Review - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
276	GROTH	Google Review - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
277	GRP	Google Review - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
278	GRPQ	Google Review - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
279	GRPR	Google Review - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
280	GRPS	Google Review - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
281	GRREFUND	Google Review - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
282	GRRS	Google Review - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
283	GRST	Google Review - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
284	GRTFT	Google Review - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
285	GRWT	Google Review - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
286	HAS	Hardware Support	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
287	IABC	Incorrect Campaign Application	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
288	ICA	Incorrect Campaign Application	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
289	INCP	Incorrect Name Captured for Product	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
290	INCPKG	Incorrect Name Captured for PKG/Session	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
291	INFOAT	Info - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
292	INFOCC	Info - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
293	INFORF	Info - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
294	INFOT	Info - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
295	JDAT	Justdial - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
296	JDDRB	Justdial - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
297	JDFDB	Justdial - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
298	JDOTH	Justdial - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
299	JDRF	Justdial - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
300	JDT	Justdial - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
301	JDTFT	Justdial - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
303	MNCP	Missed Name Captures For Product	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
304	MNCPKG	Missed Name Captures PKG/Session	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
305	MPR	Multiple Package Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
306	MSAC	Mouthshut - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
307	MSAO	Mouthshut - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
308	MSAR	Mouthshut - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
309	MSAT	Mouthshut - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
310	MSCC	Mouthshut - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
311	MSCRT	Mouthshut - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
312	MSDR	Mouthshut - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
313	MSDRB	Mouthshut - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
314	MSFDB	Mouthshut - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
315	MSHI	Mouthshut - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
316	MSL	Mouthshut - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
317	MSLP	Mouthshut - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
318	MSN	Mouthshut - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
319	MSO	Mouthshut - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
320	MSOS	Mouthshut - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
321	MSP	Mouthshut - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
322	MSPQ	Mouthshut - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
323	MSPR	Mouthshut - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
324	MSPS	Mouthshut - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
325	MSRF	Mouthshut - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
326	MSRS	Mouthshut - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
327	MSST	Mouthshut - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
328	MST	Mouthshut - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
329	MSTF	Mouthshut - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
330	MSWT	Mouthshut - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
331	NES	Network Support	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
332	OAS	Office Administration Support	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
333	OTPI	OTP Issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
334	OrderRepmnt	Order Replacement	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
335	Others	Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
336	PAS	Painting Service	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
337	PBC	Product Bill Cancellation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
338	PCGLP	Prepaid card/Gift card/Loyalty points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
339	PEC	Pest Control	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
340	PIS	Printing & Stationery	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
341	PMC	Payment Mode Changes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
342	PNU	Phone No Update	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
343	PRJ	Project Services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
344	PRO	Procurment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
367	PRS	Pantry Services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
368	PWM	Plumbing & Water Management	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
369	ProductConcern	Product Concern	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
370	REAT	Real Estate Management	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
371	REM	Removal of Excess Payment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
372	REP	Resource/Employee Addition/Transfer	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
373	RF	Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
374	Refund	Refund Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
375	SEAC	Support Emails - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
376	SEAO	Support Emails - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
377	SEAR	Support Emails - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
378	SEAT	Support Emails - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
379	SECC	Support Emails - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
380	SECRT	Support Emails - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
381	SEDR	Support Emails - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
382	SEDRB	Support Emails - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
383	SEFDB	Support Emails - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
384	SEHI	Support Emails - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
385	SEL	Support Emails - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
386	SELP	Support Emails - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
387	SEN	Support Emails - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
388	SEO	Support Emails - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
389	SEOS	Support Emails - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
390	SEP	Support Emails - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
391	SEPQ	Support Emails - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
392	SEPR	Support Emails - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
393	SEPS	Support Emails - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
394	SERF	Support Emails - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
395	SERS	Support Emails - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
396	SES	Support Emails - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
397	SEST	Support Emails - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
98	AIC	Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
99	AT	Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
100	AUTH	Authentication	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
101	BC	Bill Cancellation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
102	BCP	Billing Complimentary Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
103	BCS	Billing Complimentary Sessions	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
104	BDOBILLS	Back Dating of Bills	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
105	BOCFDP	Billing Old Client Full Discount Package	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
106	BPMAT	BPM - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
107	BPMCC	BPM - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
108	BPMDRB	BPM - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
109	BPMEAC	BPM Escalation - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
110	BPMEAO	BPM Escalation - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
111	BPMEAR	BPM Escalation - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
112	BPMEAT	BPM Escalation - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
113	BPMECC	BPM Escalation - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
114	BPMECRT	BPM Escalation - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
115	BPMEDR	BPM Escalation - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
116	BPMEDRB	BPM Escalation - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
345	PRODAC	Products - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
346	PRODAO	Products - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
347	PRODAR	Products - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
348	PRODAT	Products - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
349	PRODCC	Products - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
350	PRODCRT	Products - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
351	PRODDR	Products - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
352	PRODDRB	Products - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
353	PRODFDB	Products - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
354	PRODHI	Products - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
355	PRODL	Products - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
356	PRODLP	Products - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
357	PRODN	Products - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
358	PRODOS	Products - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
359	PRODP	Products - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
360	PRODPQ	Products - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
361	PRODPR	Products - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
362	PRODPS	Products - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
363	PRODRS	Products - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
364	PRODST	Products - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
365	PRODTMT	Products - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
366	PRODWT	Products - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
405	SFDBKCC	Service Feedback - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
406	SFDBKCRT	Service Feedback - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
407	SFDBKDR	Service Feedback - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
408	SFDBKDRB	Service Feedback - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
409	SFDBKFDB	Service Feedback - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
410	SFDBKHI	Service Feedback - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
411	SFDBKL	Service Feedback - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
412	SFDBKLP	Service Feedback - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
413	SFDBKN	Service Feedback - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
414	SFDBKO	Service Feedback - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
415	SFDBKOS	Service Feedback - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
416	SFDBKP	Service Feedback - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
417	SFDBKPQ	Service Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
418	SFDBKPR	Service Feedback - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
419	SFDBKPS	Service Feedback - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
420	SFDBKRF	Service Feedback - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
421	SFDBKRS	Service Feedback - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
422	SFDBKST	Service Feedback - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
423	SFDBKT	Service Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
424	SFDBKTMT	Service Feedback - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
425	SFDBKWT	Service Feedback - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
427	TCC	Telephone	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
429	THFT	Theft	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
430	TR	Order Tracking	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
431	TSCAC	TSC - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
432	TSCAO	TSC - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
433	TSCAR	TSC - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
434	TSCAT	TSC - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
398	SET	Support Emails - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
399	SETMT	Support Emails - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
400	SEWT	Support Emails - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
401	SFDBKAC	Service Feedback - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
402	SFDBKAO	Service Feedback - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
403	SFDBKAR	Service Feedback - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
404	SFDBKAT	Service Feedback - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
428	TEL	Telephone	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
435	TSCCC	TSC - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
436	TSCCRT	TSC - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
437	TSCDR	TSC - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
438	TSCDRB	TSC - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
439	TSCFDB	TSC - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
440	TSCHI	TSC - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
441	TSCL	TSC - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
442	TSCLP	TSC - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
443	TSCN	TSC - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
444	TSCO	TSC - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
445	TSCOS	TSC - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
446	TSCP	TSC - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
447	TSCPQ	TSC - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
448	TSCPR	TSC - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
449	TSCPS	TSC - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
450	TSCRF	TSC - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
451	TSCRS	TSC - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
452	TSCST	TSC - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
453	TSCT	TSC - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
454	TSCTMT	TSC - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
455	TSCWT	TSC - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
456	TWAC	Twitter - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
457	TWAO	Twitter - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
458	TWAR	Twitter - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
459	TWAT	Twitter - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
460	TWCRT	Twitter - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
461	TWDR	Twitter - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
462	TWDRB	Twitter - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
463	TWFDB	Twitter - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
464	TWHI	Twitter - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
465	TWL	Twitter - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
466	TWLP	Twitter - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
467	TWN	Twitter - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
468	TWOS	Twitter - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
469	TWOTH	Twitter - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
470	TWP	Twitter - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
471	TWPQ	Twitter - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
472	TWPR	Twitter - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
473	TWPS	Twitter - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
474	TWRF	Twitter - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
475	TWRS	Twitter - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
476	TWST	Twitter - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
477	TWT	Twitter - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
478	TWTFT	Twitter - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
479	TWWT	Twitter - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
480	Treatment	Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
481	UAEP	Uploading Adverse Event Picture	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
482	UP	Unfreeze Package	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
483	VEP	Validity Extention of Package	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
484	WAM	Waste Management	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
485	WC	Wrong Consumption	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
486	WE	Wrong products ordered	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
487	WEBAC	Website - Air Conditioner	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
488	WEBAO	Website - Adverse Outcomes	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
489	WEBAR	Website - Appointment reschedule	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
490	WEBCRT	Website - CRT Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
491	WEBDR	Website - Delivery Status	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
492	WEBHI	Website - Hygiene issues	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
493	WEBL	Website - Loyalty	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
494	WEBLP	Website - Loyalty Points	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
426	SOS	Software Support	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
495	WEBN	Website - No Comments only rating	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
496	WEBOS	Website - overall services	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
497	WEBP	Website - Products	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
498	WEBPQ	Website - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
499	WEBPR	Website - Pricing Quotation	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
500	WEBPS	Website - Payment related concerns	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
501	WEBRS	Website - Less Than Desireable results	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
502	WEBST	Website - ST Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
503	WEBWT	Website - Wait Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
504	WECC	Website - Confirmation Call	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
505	WEDRB	Website - Dr Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
506	WEFDB	Website - FD Behaviour	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
507	WEGAT	Website - Appointment Time	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
508	WEOTH	Website - Others	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
509	WEREFUND	Website - Refund	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
510	WETFT	Website - Treatment	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
511	WRP	Wrong Refund of Package	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
512	WRPRODUCT	Wrong refund of Product	\N	Active	2026-03-20 18:14:08.809179+05:30	2026-03-20 18:45:10.433473+05:30
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_comments (id, ticket_id, "user", message, type, created_at) FROM stdin;
29	21	Killana	Status changed from "Open" to "Acknowledged". Priority changed from "Medium" to "Low". Assigned to Suresh  SB. Reason: ACK	status_change	2026-03-23 01:09:42.936152+05:30
30	21	Killana	Please share the error screenshot	comment	2026-03-23 01:18:26.011227+05:30
31	21	Killana	Status changed from "Acknowledged" to "Resolved". Reason: resolved the issue	status_change	2026-03-23 01:19:43.770609+05:30
32	21	Killana	Status changed from "Resolved" to "Re-Open". Reason: work not yet finished but they closed as serviced	status_change	2026-03-23 01:35:36.594671+05:30
33	22	Atman	Approved by Atman (AOM). Escalated to Finance team for final approval. Comment: Proceed	approval	2026-03-23 13:00:56.422378+05:30
34	23	Atman	Approved by Atman (AOM). Escalated to Finance team for final approval. Comment: proceed	approval	2026-03-23 14:54:02.221084+05:30
35	23	Ilaiah  Dongari	Approved by Ilaiah  Dongari (Finance). Sent to Zenoti team for correction. Comment: proceed 	approval	2026-03-23 14:55:15.491834+05:30
36	22	Ilaiah  Dongari	Follow-up requested by Ilaiah  Dongari: need more information	approval	2026-03-23 15:19:53.856065+05:30
37	22	Atman	Follow-up requested by Atman: Need information	approval	2026-03-23 15:25:47.824408+05:30
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, code, title, description, category, sub_category, priority, status, raised_by_id, raised_by_dept, assigned_to_id, assigned_dept, center, due_date, sla_breached, approval_required, approver, approval_status, resolution, created_at, updated_at, zenoti_location, zenoti_main_category, zenoti_sub_category, zenoti_child_category, zenoti_mobile_number, zenoti_customer_id, zenoti_customer_name, zenoti_billed_by, zenoti_invoice_no, zenoti_invoice_date, zenoti_amount, zenoti_description, approval_type) FROM stdin;
23	TKT0023	Payment Issue	Payment issue	Zenoti-Finance	Billing Complimentary Products	Critical	InProgress	735	Zenoti	702	Zenoti	CG Road	\N	f	t	Ilaiah  Dongari	Approved	\N	2026-03-23 14:51:05.227685+05:30	2026-03-23 14:58:58.030727+05:30	CG Road	Zenoti-Finance	Billing Complimentary Products	Billing Software installation	9632587411	BN01123	Thanu	Siri	HYD18765	2026-03-21	5000	Please resolve asap	aom_finance
24	TKT0024	appointment time	appointment time	Zenoti-Operational	Appointment Time	High	Open	735	Zenoti	\N	Zenoti	Electronic City	\N	f	t	\N	\N	\N	2026-03-23 15:24:33.483344+05:30	\N	Electronic City	Zenoti-Operational	Appointment Time	Billing Software installation	987654234	BNO12345	siri	thanuja	INV1234	2026-03-23	6500		aom_only
22	TKT0022	Billing Issue	Billing Issue	Zenoti-Finance	Back Dating of Bills	High	PendingApproval	714	Zenoti	\N	Zenoti	CG Road	\N	f	t	Atman	Pending	\N	2026-03-23 12:52:16.188845+05:30	2026-03-23 15:25:47.824408+05:30	CG Road	Zenoti-Finance	Back Dating of Bills	Billed in Wrong Client Id	9874563211	BN01NC123	thanu	siri	HYD12345	2026-03-20	3000	Please resolve asap	aom_finance
20	TKT0001	Ac issue	Ac issue	Operational Issues	Air Conditioner	Low	Open	698	Admin Department	\N	Admin Department	Jubilee Hills	\N	f	f	\N	\N	\N	2026-03-23 01:07:38.074994+05:30	\N	\N	\N	\N	ACP	\N	\N	\N	\N	\N	\N	\N	\N	\N
21	TKT0021	Software	Software issue	BPM	Authentication	Low	Open	698	IT Department	703	IT Department	Electronic City	\N	f	f	\N	\N	\N	2026-03-23 01:08:32.829699+05:30	2026-03-23 01:35:36.517023+05:30	\N	\N	\N	Application	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, code, name, email, hashed_password, role, department_id, center_id, avatar, status, last_login, created_at, updated_at, employee_id, designation, gender, mobile, reporting_to, map_level_access, entity, vertical, costcenter, grade, employee_type, city, employee_dob, employee_doj, lwd, effective_date, remarks) FROM stdin;
851	HSR-QA	HSR-QA	tejaswini.tiwari@olivaclinic.com	$2b$12$QXNL0mk3JcpjjGZTZjI2X.p3jA0Qy6xkmNGg0B8b1Irffgl6MWIrm	Clinic Manager	\N	114	HS	Active	\N	2026-03-22 23:16:04.0869+05:30	\N	HSR-QA	Clinic Incharge				Can View and Edit	Oliva	Oliva	Oliva	Off-Roll		Bengaluru					
852	HYD-GBL	Gachibowli	gachibowliteam@olivaclinic.com	$2b$12$Ro8q7TdpEUUJbycbqvBqz.PWkZ8KYipbL9WQvAiTvLod924j9vneK	Employee	\N	146	GA	Active	\N	2026-03-22 23:21:25.978855+05:30	\N	HYD-GBL	Clinic Incharge	F			Can View and Edit	Oliva	Oliva	Oliva	On-Roll		Hyderabad					
853	KLR-COCHIN	KLR  COCHIN	kadavanthara@olivaclinic.com	$2b$12$zmxcB8pHpgJNNK6/QRwgiuIImiwL0OgfO4kbewyZW3UAAu2M.VzHW	Employee	\N	119	KC	Active	\N	2026-03-22 23:24:18.963894+05:30	\N	KLR-COCHIN	Clinic Incharge	F			Can View and Edit	Oliva	Oliva	Oliva		Off-Roll	Cochin					
699	pallavip	Pallavi  p	pallavip@olivaclinic.com	$2b$12$QTMLLzjOBz17F56wlKmBUuLAYE0XHTrivxFS9V.LE8RAjFZi.s1/W	QA	\N	\N	PP	Active	2026-03-23 01:23:26.637955+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 01:23:26.232557+05:30	pallavip	\N	M	9000730055	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
698	U001	Killana	killana@olivaclinic.com	$2b$12$yNcHaWWD/.SDtuRwhnX2Gu72RzIlfem1g.AttFVzJigT0p3hu0tAK	Super Admin	\N	\N	KI	Active	2026-03-23 14:47:08.191473+05:30	2026-03-20 15:23:54.196635+05:30	2026-03-23 14:47:07.74815+05:30	U001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
719	a15	bng1	bng1@olivaclinic.com	$2b$12$9mPwyaU8UsgPCML2wI1.bemM/FWQgmAhyAMvTDRJwibEZnq48AL3q	Clinic Incharge, Clinic Manager	\N	114	BN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a15	\N	mr	\N	\N	Can View and Edit	\N	\N	\N	off-role	\N	Bengaluru	\N	\N	\N	\N	\N
736	WF-QA	WF-QA	astha.kapoor@olivaclinic.com	$2b$12$NZdkdwwpMyolV23JGKUoT.uYqoA4vUmP8WMaGOn7yjGUgggrjbFp2	Area Operations Manager	\N	115	WF	Active	2026-03-23 01:32:17.796166+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 01:32:17.261606+05:30	WF-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
708	Punjabi bagh – QA	PB-QA	neha.yadav@olivaclinic.com	$2b$12$01Ln9O6RGV4emb1/v/x9I.N5Jg7EJy85aIMk1MDeqnMsdj05LJ4WC	Clinic Manager	49	\N	PB	Active	2026-03-23 01:45:53.558142+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 01:45:53.096304+05:30	Punjabi bagh – QA	Clinic Manager	Female	1234567890	101969	Can View	Oliva	OLIVA	OLIVA	A	Off-Roll	\N	\N	2023-11-20	\N	2023-11-20	\N
728	Annabel	Annabel  Mak	annabel.mak@olivaclinic.com	$2b$12$XnTXR3UoXl87WmdMIsvCsOlbdYd5pQ8lM69svWNFRjpZjrrTrUHUC	Clinic Incharge, Clinic Manager	\N	\N	AM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Annabel	\N	M	\N	\N	Can View and Edit	\N	\N	\N	\N	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
854	ZNT-TM	ZenotiTeam	ZenotiTeam@olivaclinic.com	$2b$12$mxZLY8GfY5AJ0G3LlAOG9uGLnaz67YZLmCa6cX/7hGTs89p6npU/6	Zenoti Team	\N	\N	ZE	Active	2026-03-23 14:57:14.172005+05:30	2026-03-23 11:54:27.626046+05:30	2026-03-23 14:57:13.762767+05:30	ZNT-TM					Can View and Edit	Oliva	Oliva	Oliva								
855	AOM	Atman	atman@olivaclinic.com	$2b$12$SX8bX0fDQ6YydUQHVYDNEOknKx2c/hA6xAOCE6Ax0RajgzFLbNCZy	Area Operations Manager, Area Operations Manager Head	35	136	AT	Active	2026-03-23 15:25:15.612623+05:30	2026-03-23 12:41:26.549527+05:30	2026-03-23 15:25:15.148542+05:30	AOM	Area Operations Manager	M			Can View and Edit	Oliva	Oliva	Oliva			Hyderabad					
804	llaiah	Ilaiah  Dongari	ilaiah.dongari@olivaclinic.com	$2b$12$ws9mxB5fLti6n7oQJsrBnej84m96ttKsp39hQv5wMbOoV53Tj8lp2	Finance Head	35	\N	ID	Active	2026-03-23 15:18:06.849115+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 15:18:06.416676+05:30	llaiah		M							Off-Roll	Off-Roll	Hyderabad					
839	BLR-HSR	HSR Layout Clinic	hsrlayout@olivaclinic.com	$2b$12$w7lEDEVG00l22mHC.WzdeuI8rdwc.3DeR5jGuxA/W1nbvq4Qzq8Wi	Employee	\N	114	HC	Active	\N	2026-03-22 01:34:54.920742+05:30	2026-03-22 23:06:59.419164+05:30	BLR-HSR	Clinic Incharge	F		AOM-BLR	Can View and Edit	Oliva	Oliva	Oliva	On-Roll	EMPLOYEE	Bengaluru	1900-01-01				
840	BLR-IND	Indira Nagar	indiranagarteam@olivaclinic.com	$2b$12$vZTLGqpuTd4kKSaPVZX6SuwhgYgxo2FtFkERCfOPuI8W2yP4f4Wbe	Employee	\N	139	IN	Active	\N	2026-03-22 01:39:06.928453+05:30	2026-03-22 23:06:59.419164+05:30	BLR-IND	Clinic Incharge		9741591222		Can View and Edit				On-Roll		Bengaluru					
843	BLR-SDS	Sadashiv Nagar	sadashivnagarteam@olivaclinic.com	$2b$12$10l.4Fd6e1oRTgs522IrPOi0jltKYah7U3FwwpeqiZiykMHGoJVH6	Employee	\N	141	SN	Active	\N	2026-03-22 01:47:26.1556+05:30	2026-03-22 23:06:59.419164+05:30	BLR-SDS	Clinic Incharge		7337363952		Can View and Edit				On-Roll		Bengaluru					
844	CHN-ADR	Adyar  Clinic	adyar@olivaclinic.com	$2b$12$pJmSk/XZ5WkaB41rB.crWOK2xNPtLMW24egYd8d/5OKF17wRx9E0a	Employee	\N	142	AC	Active	\N	2026-03-22 01:51:26.771912+05:30	2026-03-22 23:06:59.419164+05:30	CHN-ADR	Clinic Manager	F		CHN-AOM	Can View	Oliva	Oliva	Oliva	A	EMPLOYEE						
846	CHN-ANG	Annanagar Clinic  Clinic	annanagarteam@olivaclinic.com	$2b$12$y93aWo9w1iUKS6RW6XYlHOQ22sdsGEjqqyW/HkMfJexkNEuPpgTse	Employee	\N	144	AC	Active	\N	2026-03-22 22:20:44.700889+05:30	2026-03-22 23:06:59.419164+05:30	CHN-ANG	Clinic Incharge	F	7330999274	AOM-CHN		Oliva	Oliva	Oliva	On-Roll	EMPLOYEE	Chennai					
848	CRT-KN	CRT-KN	kalyaninagar@olivaclinic.com	$2b$12$EE/XLX8yvveZBlU6CsEU8uUryCv40OQoXC2bPuuxnHKV7WE70GnzW	Clinic Incharge, Clinic Manager	\N	131	CR	Active	\N	2026-03-22 22:42:00.186831+05:30	2026-03-22 23:06:59.419164+05:30	CRT-KN	Clinic Incharge	F			Can View and Edit	Oliva	Oliva	Oliva		Off-Roll	Pune					
849	CRT-PP	Pitam  Pura	pitampura@olivaclinic.com	$2b$12$4NlxtDZz4QF2xyenKH/ZGOSEXYe1mVdrT3ZdvIfRz6IUqvPYhZUbO	Clinic Incharge	\N	123	PP	Active	\N	2026-03-22 22:45:36.202451+05:30	2026-03-22 23:06:59.419164+05:30	CRT-PP	Clinic Incharge	F		poornima	Can View and Edit	Oliva	Oliva	Oliva	A	Off-Roll	Delhi					
856	U003	thanu	thanu@olivaclinic.com	$2b$12$1eLrY6.3byhZORdwYM5e/ONpRb6wu37Mb/LFeJHB1Sz8MtIfSWvfm	Super User	34	136	TH	Active	2026-03-23 14:26:48.394336+05:30	2026-03-23 13:13:33.713003+05:30	2026-03-23 14:26:47.97847+05:30	U003	IT ADMIN	F	9632582214		Can View and Edit					Employee	Hyderabad					
847	CRT-JN	CRT-JN	jayanagarteam@olivaclinic.com	$2b$12$nR7RAGvvpdmcwe5mChtwbO55B28w5PzJVV2rh94V55ua1Rpu6c21i	Clinic Incharge	\N	137	CR	Active	\N	2026-03-22 22:24:27.167624+05:30	2026-03-22 23:06:59.419164+05:30	CRT-JN		F			Can View				Off-Roll	Off-Roll	Bengaluru					
808	Navya S	Navya  Shivanna	navya.shivanna@olivaclinic.com	$2b$12$ExDdZLF9fh01KSr4K9blq.77L.Qg1tY4PrbFaWb.GxXnBQhcAkxGW	Area Operations Manager, Area Operations Manager Head, Employee	\N	\N	NS	Active	2026-03-23 13:42:20.044523+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 13:42:19.629466+05:30	Navya S	\N	F	\N	Poornima	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
705	101969	Shweta  Pushkar	shweta.pushkar@olivaclinic.com	$2b$12$FeGJxxkMfeyXoINQKe9v4Oa8u37xuXsi/f/h27U4.ko8MIYKaZjJS	Area Operations Manager	\N	\N	SP	Active	2026-03-23 14:13:49.873335+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 14:13:49.458377+05:30	101969	Area Operations Manager	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	\N	\N	\N	\N	\N	\N
700	101341	Sandhya  Rani	sandhya.arrivu@olivaclinic.com	$2b$12$vaYeSniRpr9hR7Gu4CnTKuwaUum/puslJH/xrAmrRG/7Zpe8fUpli	Clinic Incharge, Clinic Manager	\N	116	SR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	101341	Clinic Incharge	F	\N	AOM-BLR2	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
701	101548	Shankar  Gunti	shankar.gunti@olivaclinic.com	$2b$12$WnuBnxdfkssZ8tuXxvM4HOlygHewRG1YqWQCDXYgw8JyygaiiXpia	Help Desk Admin, Helpdesk In-charge	\N	\N	SG	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	101548	Admin Member	M	\N	\N	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
702	101655	Suresh  SB	suresh.sb@olivaclinic.com	$2b$12$lFvC3v2y9K/IMLQ5WI4wg.BYKf4YDDFWYnQ0mgjV1IfRK9I1Ve3gS	Employee, Helpdesk In-charge	\N	\N	SS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	101655	Admin Member	M	\N	1017	Can View and Edit	\N	\N	\N	On-Roll	Off-Roll	Hyderabad	\N	2018-05-28	\N	\N	Admin Member
704	101868	PruthviRaj  Goud	pruthviraj.s@olivaclinic.com	$2b$12$IeC7ZsLdstYFD/hIiLxINuwsjmghEB8/QuJs1e1ZngufEIfQb0ENq	Help Desk Admin, Helpdesk In-charge, MANAGER	\N	\N	PG	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	101868	Admin Member	M	\N	1017	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
706	1020	Deepu  CP	deepu.cp@olivaclinic.com	$2b$12$a3QoosutfQRxQtUEmiNZEuK1CsPbEXaJ26bJZwI5nQqIX.3W/zqdC	Employee, Help Desk Admin, Helpdesk In-charge	\N	\N	DC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	1020	\N	M	\N	1011	Can View and Edit	Oliva	OLIVA	OLIVA	A	EMPLOYEE	Hyderabad	\N	1900-01-01	\N	\N	\N
707	102099	Kalyani  Thadoju	kalyani.thadoju@olivaclinic.com	$2b$12$ByF4FzE2wykKZ4Kgz3epo..YHo9ODEbiikDW10iD7w0POV5L2OD56	MANAGER	\N	\N	KT	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	102099	\N	F	\N	poornima	Can View	\N	\N	\N	\N	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
709	102646	Rupali  Rane	rupalirane@olivaclinic.com	$2b$12$et2NXogviz19YwqscwgtOuZk9toVIYMc1Yb0io0jGeCKLu/4D1Txy	Employee, L2 Manager	\N	\N	RR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	102646	\N	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
710	102678	Bharath  Chandra	bharath.mekala@olivaclinic.com	$2b$12$597/mnjnMWlE/r.DrtojcOOnL8LIj03BJUCg592cRPHQV8DQdgLG2	Employee	\N	\N	BC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	102678	IT ADMIN	M	\N	\N	\N	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
711	102679	Narsimlu  Laxman	narsimlu.laxman@olivaclinic.com	$2b$12$PFGx/EHLXgQykIDfNBYPEurxGOQzset9AN74jCBWFnWsR7GJJbhHW	Finance	\N	\N	NL	Active	2026-03-20 23:41:47.527811+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	102679	\N	M	\N	Shiva	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
712	102911	Tanima Ghosh Dastidar	tanima.ghosh@olivaclinic.com	$2b$12$uYxjtsOjlBnWd2zqtQmGUe/ZrwjnZb6rDU9nzNeFbhFNXZIHWVlMW	Area Operations Manager	49	129	TD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	102911	Area Operations Manager	F	\N	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Kolkata	\N	\N	\N	\N	\N
713	900001	Sumita  Kaul	sumitakaul@olivaclinic.com	$2b$12$YGUX9vH2KF63bjb0gy8vg.AKluys2qHSunM960Pt5C7v7SEoyD1tu	Area Operations Manager	49	\N	SK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	900001	Area Operations Manager	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Pune	\N	\N	\N	\N	\N
715	CRT-ETC	CRT  ETC	electroniccityteam@olivaclinic.com	$2b$12$K1s605OFp8gCOEJEIWjzzu1/E5JHLdKV.AlhBhyLIO1hWSyfsTBh2	Clinic Incharge, Clinic Manager	49	113	CE	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-ETC	Clinic Incharge	F	\N	Tejaswini	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
716	CRT-OMR	CRT  OMR	omrteam@olivaclinic.com	$2b$12$SZqygSR7eH8LU2nwFYvZguafBwUExinvw32GQtnD8R/T7LF/EUTN6	Clinic Incharge, Clinic Manager	49	118	CO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-OMR	Clinic Incharge	F	\N	Karthik	Can View	\N	\N	\N	Off-Roll	Off-Roll	Chennai	\N	\N	\N	\N	\N
717	CRT-KHD	CRT  KHD	kharaditeam@olivaclinic.com	$2b$12$Lc2ajqBiLHxFGpG3dylpSerKMieFXlLS2pkQThPqx3/m7HRxjKO5.	Clinic Incharge, Clinic Manager	49	132	CK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-KHD	Clinic Incharge	F	\N	900001	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Pune	1900-01-01	1900-01-01	\N	\N	\N
718	CRT-VJY	CRT  VJY	vijayawada@olivaclinic.com	$2b$12$xfRxJiCXnFXqOxzh8cVee.a6e8gwkrHC0F3p.c/FIsEWGT4QQ2vVK	Clinic Incharge, Clinic Manager	\N	134	CV	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-VJY	Clinic Incharge	F	\N	keerthi	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Vijayawada	\N	\N	\N	\N	\N
720	a19	bng2	bng2@olivaclinic.com	$2b$12$Yv89gf/TyZLb.iuq3jGXjeS/8Gt1TEEmwlKAhkc.ctCZJ5HSgsOoy	Area Operations Manager, Employee	\N	\N	BN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a19	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Bengaluru	\N	\N	\N	\N	\N
721	a22	pune	pune@olivaclinic.com	$2b$12$xHTi7Yhh5amoilcsXpXW3eipv2swL5x2.ZPLd6YVv53rLW8/nQFH2	Area Operations Manager, Employee	\N	133	PU	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a22	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Pune	\N	\N	\N	\N	\N
722	a25	kolkata	kolkata@olivaclinic.com	$2b$12$GPu4qXU5Xv9QzPpHhwkl/OJogMhLm41tsVA.Xk6aoasjWc7W.5u1q	Area Operations Manager, Employee	\N	128	KO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a25	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Kolkata	\N	\N	\N	\N	\N
723	a29	chennai	chennai@olivaclinic.com	$2b$12$usEXSdp6mzw5q.UKfN8vWOF.Zv/DZGjkQHuOPvkGWdkI55Q79cIVG	Area Operations Manager, Employee	\N	\N	CH	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a29	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Chennai	\N	\N	\N	\N	\N
724	a4	hyd1	hyd1@olivaclinic.com	$2b$12$BfmDoNyB0URhhzjlztz6Ae3nkS5bc4mYmpBirP.mwBTjg8nm7KEAC	Area Operations Manager, Employee	\N	\N	HY	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a4	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Hyderabad	\N	\N	\N	\N	\N
725	a9	hyd2	hyd2@olivaclinic.com	$2b$12$XDstfVPDiYbkyeYP3LCE7elsAva2zvaMGbYj9v0h2jyUeL735PJsu	Area Operations Manager, Employee	\N	\N	HY	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	a9	\N	mr	\N	\N	\N	\N	\N	\N	off-role	\N	Hyderabad	\N	\N	\N	\N	\N
726	Abhinav	Abhinav	abhinav.boppa@olivaclinic.com	$2b$12$a1z2Qs8Ty7EFuLcsM2tdIOBu7bVdPXAEaJE1kZ7WBP8Pbxpa/z3wG	Area Operations Manager, Employee	\N	\N	AB	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Abhinav	Marketing Manager	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
727	AD-QA	AD-QA	felicia.jereline@olivaclinic.com	$2b$12$kaEm82Kbn2Wc0ZObwQIM..zxZz9fmMVPS9tTZZJzMoUhRezr1hJam	Clinic Manager	\N	\N	AD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	AD-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Chennai	\N	1900-01-01	\N	\N	\N
755	CRT-JP	CRT-JP	jodhpurpark@olivaclinic.com	$2b$12$EUNt3HCuZmoUuZIcENPNXejjIfvBmFYcrB.8gos.EviDtlE3rSSya	Clinic Incharge	\N	128	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-JP	\N	F	\N	\N	Can View	\N	\N	\N	\N	Off-Roll	Kolkata	\N	1900-01-01	\N	\N	\N
703	1017	Rajesh  Alur	rajesh@olivaclinic.com	$2b$12$Y4RPjO70uUPnapjO5q8VGOVMcduDddUr/wyZWdSqtUgSCGKGY0mLW	Global Admin, Help Desk Admin, Helpdesk In-charge, L1 Manager, Super User	\N	\N	RA	Active	2026-03-23 01:40:00.454147+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 01:40:00.070337+05:30	1017	Administration	M	9000270055	1010	Can View and Edit	\N	\N	\N	On-Roll	EMPLOYEE	Hyderabad	1983-02-16	2009-01-19	\N	\N	\N
714	90004	Yelhanka  Clinic	yelhankateam@olivaclinic.com	$2b$12$6Z1z8PhG/B1UacOuCnryE.AdqFigDW44NfrkgLPNbmHU/4M.SJrEe	Employee	49	116	YC	Active	2026-03-23 12:50:31.078587+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 12:50:30.852424+05:30	90004	Clinic Incharge	F	\N	AOM-BLR2	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
729	AN-QA	AN-QA	sarvesh.chandran@olivaclinic.com	$2b$12$RMxhN4fD28K7cQ4lcv2N9uo0UJ1/du6t9kfXBEl.d7jor5fq9nUxy	Clinic Incharge, Clinic Manager	\N	\N	AN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	AN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Chennai	\N	1900-01-01	\N	\N	\N
730	JN-QA	JN-QA	triveni.eric@olivaclinic.com	$2b$12$5FjEOe4mqq5P1eJZ1bv2zuoSd/SBTNYMaf9zZRo.olVdsRFLhEsd2	Clinic Manager	\N	\N	JN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	JN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
732	AOM-Chennai	AOM  Chennai	karthik.sn@olivaclinic.com	$2b$12$GUZ8PHy37ynT4zxphDKTk.y12veLVRdQS7pZKJ3rb1aJBJocSb8Ze	Area Operations Manager, Area Operations Manager Head	49	\N	AC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	AOM-Chennai	Area Operations Manager	M	\N	poornima	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Chennai	\N	\N	\N	\N	\N
733	AOM-HYD	Georgina  William	georgina.william@olivaclinic.com	$2b$12$MCylZb95kyNK7FlpbytWU.UaExmGlDKyRFss777/Dz/rvH/Bl6FBq	Area Operations Manager	\N	\N	GW	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	AOM-HYD	Area Operations Manager	F	7331158523	1014	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	EMPLOYEE	Hyderabad	\N	\N	\N	\N	\N
734	Lavanya	Lavanya  Oliva	vizag@olivaclinic.com	$2b$12$2IoQvkQ7gPhZmP5PltYOfuicVlLopcLSY3rkkgr5ozOZudKJJbuHO	Clinic Incharge	\N	135	LO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Lavanya	Clinic Incharge	F	\N	HYD-AOM2	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Vizag	\N	1900-01-01	\N	\N	\N
737	CRT-AH	CRT  AH	nazish.ansari@olivaclinic.com	$2b$12$aCQfwEgxj9L7pc4Ddz0ome2T1tY0DV91FYdBAbq6wsDpdrSaOjyqC	Clinic Incharge, Clinic Manager, Helpdesk In-charge	49	130	CA	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-AH	Clinic Incharge	M	\N	101769	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Pune	\N	1900-01-01	\N	2023-12-12	\N
738	AW-QA	AW-QA	karthikeyan.c@olivaclinic.com	$2b$12$u4mN06SCn3BFU8u9IMMhrO3kiqZ4a0FZIWk15vJizUdNBQ4QGAWfa	Clinic Incharge, Clinic Manager	\N	\N	AW	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	AW-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Chennai	\N	1900-01-01	\N	\N	\N
739	Baljinder	Baljinder  Kaur	jubileehills@olivaclinic.com	$2b$12$NM0q70XIdEUHVvAxC.2hhepyOZ7119mILTIZJFlto61nJgkuXw7Aa	Clinic Incharge, Clinic Manager	\N	125	BK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Baljinder	\N	F	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
740	BH-QA	BH-QA	shubha.manne@olivaclinic.com	$2b$12$Qfz/Wjsoa9OQnmUGCTjo5ee1VJZwkkmK2BpQSiztlzOy/f.770roO	Clinic Incharge, Clinic Manager	\N	\N	BH	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	BH-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
741	BLR-HRBR	HRBR  Clinic	kammanahalliteam@olivaclinic.com	$2b$12$kBuROWlg1TGaRVR3xhHMWONQucCLYy8SfRT2YDE6frFuPslviH8w.	Employee	\N	\N	HC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	BLR-HRBR	Clinic Incharge	M	9652518822	AOM-BLR	Can View	Oliva	OLIVA	OLIVA	On-Roll	EMPLOYEE	Bengaluru	\N	1900-01-01	\N	\N	\N
742	CRT-HSR	CRT-HSR	hsrlayout@olivaclinic.com	$2b$12$l9s1fbdH8hbivv0w0rWF2e4Vmv8tVs8qXz2wgBJmkX6/c3iSu3kQi	Clinic Incharge, Clinic Manager	\N	114	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-HSR	Clinic Incharge	F	\N	AOM-BLR	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
743	divya	Divya  Rao	indiranagarteam@olivaclinic.com	$2b$12$Qn6PZKTwZwIU6rIFJFQLQOHS9TN9y9KngtKPi4LauPr/DO9nENAMW	Clinic Incharge, Clinic Manager	\N	\N	DR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	divya	Clinic Incharge	F	9741591222	\N	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
744	DivyaSripathy	Divya  Sripathy	jayanagarteam@olivaclinic.com	$2b$12$nCzc8Lqn7YfklerjmjnLI.89A0N5veIrcuadIc09lCTK5uDnc8y.W	Clinic Incharge, Clinic Manager	\N	\N	DS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	DivyaSripathy	Clinic Incharge	F	9611475266	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
745	CRT-KM	CRT-KM	koramangalateam@olivaclinic.com	$2b$12$npq7Pc4AlV5FHuoFowoUP.ZpI9jfNB/KhkyItdQDQsVzpVdwHXZA2	Clinic Incharge, Clinic Manager	\N	\N	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-KM	Clinic Incharge	F	7022872832	\N	Can View and Edit	\N	\N	\N	On-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
746	Karthik	Karthik  Oliva	sadashivnagarteam@olivaclinic.com	$2b$12$3MoXTNwnMJvsVM0RrSiBF.vpgzeIy6kLqE85HDaB14NepfMj5pdJi	Clinic Incharge, Clinic Manager	\N	\N	KO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Karthik	Clinic Incharge	M	7337363952	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
747	BL-YEL	Oliva  Yelahanka	yelahanka@olivaclinic.com	$2b$12$gVjZ7gEiGFod24QzX6geee8SnAfzs8neJr1SIq07VFOSWJMBT2kBC	Clinic Incharge, Clinic Manager	49	116	OY	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	BL-YEL	Clinic Incharge	M	8886621013	101341	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	1900-01-01	1900-01-01	\N	\N	\N
748	CG-QA	CG  QA	rupal.panchal@olivaclinic.com	$2b$12$n0e.S6YJtb5cuqrPx7mdfOzVdUlmfrM9choLRWqrrP9W3n/9ijSZC	Clinic Manager, Employee	\N	112	CQ	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CG-QA	\N	M	\N	qfmsadmin	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Ahmedabad	\N	\N	\N	\N	\N
749	CRT-ADY	CRT-ADY	adyar@olivaclinic.com	$2b$12$VDBmPadPQuXfQZa21ziUDu3NnhLFwd.MQEw/SgroiXrim/LctvQSK	Clinic Incharge	\N	\N	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-ADY	Clinic Incharge	M	\N	CHN-AOM	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Chennai	\N	1900-01-01	\N	\N	\N
750	CRT-ALW	CRT-ALW	alwarpetteam@olivaclinic.com	$2b$12$h6QaQrFzC8KfZSX/lFRhTuXwuJOT8ASsBC1OF1SnTZRa61vZZBTMa	Clinic Incharge, Clinic Manager	\N	\N	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-ALW	Clinic Incharge	M	9652518855	AOM-CHN	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Chennai	\N	1900-01-01	\N	\N	\N
751	CRT-ANN	CRT-ANN	annanagarteam@olivaclinic.com	$2b$12$8hrfZwlvyQChjKcsXKIDwOsCrsiB49nVceud7.L.QXnoaCb2P3mne	Clinic Incharge	\N	\N	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-ANN	Clinic Incharge	M	7330999274	AOM-CHN	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Chennai	\N	1900-01-01	\N	\N	\N
752	CRT-CGR	CRT  CGR	oliva@olivaclinic.com	$2b$12$4QRHDpMvNtHg.ZOCAka8F.9x6OAmNt1HNGG.VdGweiUcIfEmXkd6C	Clinic Incharge, Clinic Manager	\N	112	CC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-CGR	\N	F	\N	\N	\N	\N	\N	\N	Off-Roll	Off-Roll	Ahmedabad	\N	\N	\N	\N	\N
753	CRT-CH	CRT CH  CRT CH	sector17@olivaclinic.com	$2b$12$Il9s6/mJdKPPdjlglDZ6MuhOLM5/EXDpNKPjQy1X4yZetkzNUG7Ky	Clinic Incharge, Helpdesk In-charge	49	\N	CC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-CH	\N	F	\N	\N	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	\N	\N	\N	\N	\N	\N
754	CRT-HRBR	CRT-HRBR	subhrajeet.behera@olivaclinic.com	$2b$12$7r1QJPnwritM59/lgPnbVOiDZrx61qqsjsrmR8.VLh7KBsmO/.Sii	Clinic Incharge, Clinic Manager, Helpdesk In-charge	\N	\N	CR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-HRBR	Clinic Manager	M	9538958095	AOM-BLR2	Can View and Edit	Oliva	OLIVA	OLIVA	\N	Off-Roll	Bengaluru	1900-01-01	1900-01-01	\N	\N	\N
731	AOM-BLR2	Bindhu  M	bindhu.m@olivaclinic.com	$2b$12$MZd9ZnptScdJvwwtvmPBOeNJN0feNEpYyel0R0iKFRo0gUmDkph2K	Area Operations Manager	\N	\N	BM	Active	2026-03-23 13:40:22.635644+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 13:40:22.22282+05:30	AOM-BLR2	Area Operations Manager	F	\N	1010	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
735	BLR-WHF	White Field	whitefieldteam@olivaclinic.com	$2b$12$d45LkUQLXzzN6rSeOvg73eyjdyEbrG1eZF07VLR9keYN3kIbZB4hO	Employee	\N	115	WF	Active	2026-03-23 15:26:36.195522+05:30	2026-03-20 15:24:06.410631+05:30	2026-03-23 15:26:35.769571+05:30	BLR-WHF	Clinic Incharge	M	7337395720	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
756	PUN-KLN	Kalyani Nagar Clinic	kalyaninagar@olivaclinic.com	$2b$12$7SC/.nEWio559O20ClUBDerDIVlHdAI1ZGKJN.2ht1IErhZOUSR3W	Employee	\N	131	KC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	PUN-KLN	Clinic Incharge	F	\N	1011	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Pune	\N	1900-01-01	\N	\N	\N
757	DL-PTM	Pitam  pura	pitampura@olivaclinic.com	$2b$12$AT/oUn4L4Rp614fQYPX3d.qbGpMGIm3jgunTmX4vJXZ70yVUpwa9.	Employee	34	123	PP	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	DL-PTM	IT ADMIN	M	\N	poornima	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Delhi	\N	\N	\N	\N	ok
758	CRT-PV	CRT  PV	preetvihar@olivaclinic.com	$2b$12$w01IG.aHhg9UCgE3ZzL.iuOZiBQ0C2pmkLvl0HNe67EO.4IBd63eO	Clinic Incharge, Helpdesk In-charge	49	121	CP	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-PV	Clinic Incharge	F	\N	101969	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Delhi	\N	\N	\N	\N	\N
759	KOL-SALT	KOL  SALT	saltlake@olivaclinic.com	$2b$12$.TS6sz8MVWSBRKBjpDD9I.Ng7UPP.zAnvi3xzsBx8uFqY72.Y33..	Employee	\N	127	KS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	KOL-SALT	Clinic Incharge	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Kolkata	\N	1900-01-01	\N	\N	\N
760	CRT-YEL	Oliva skin and hair clinic	yelhanka@olivaclinic.com	$2b$12$bKo59Q1dshhysDLcM9aHd.eXffe9Qs5biy1UJz32xrOnQ7hQrEAsG	Employee	\N	116	OC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-YEL	Clinic Incharge	M	\N	\N	\N	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
761	CRT-YL	Yelhanka  Clinics	teamzenoti@olivaclinic.com	$2b$12$cbbB6yViuvomeuoqV5KZY.n8KTl5aXwoKCBYu5i4flkcTJzdIsdhy	Clinic Incharge, Clinic Manager	\N	\N	YC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	CRT-YL	\N	F	\N	AOM-BLR2	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	\N	\N	\N	\N	\N
762	Dilshukh	DN-QA	sujatha.robby@olivaclinic.com	$2b$12$DYwhNZF2EbN9Rr2HJOTp1.V84h5yDJqDAtB1.Pt4.ydxlMtltorOq	Clinic Manager	49	\N	DN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Dilshukh	Clinic Incharge	\N	\N	101511	Can View	Oliva	OLIVA	OLIVA	\N	\N	Hyderabad	\N	1900-01-01	\N	2023-12-12	\N
763	DL-GK2	Oliva  Greter Kailash	gk2@olivaclinic.com	$2b$12$AfqAt6uqXqI0wUPzMrV3ve4Odf19AGsLIH4QggwCEPWI4H.p2EzLe	Employee	49	122	OK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	DL-GK2	Clinic Manager	M	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Delhi	\N	\N	\N	\N	\N
764	Gayatri	Gayatri  Vagvala	gayatri.vagvala@olivaclinic.com	$2b$12$Az397Yrzzm64VaXPonhH1OCAAW4htbuUDDlsF5g8PYeC6uDI32jEW	Others	\N	\N	GV	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Gayatri	\N	F	\N	\N	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
765	GB-QA	GB-QA	nikita.yerrawar@olivaclinic.com	$2b$12$RwCkcxkvnUOkGoNIiSBAGOwbK.GhEVH3PgsXP1Hm2ilXEjQCU1Sue	Clinic Incharge, Clinic Manager	\N	\N	GB	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	GB-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
766	GK-QA	Anshu  Gupta	anshu.gupta@olivaclinic.com	$2b$12$VLnnUrOVc9DZJscgvK0tG.zw2MCi.8C8DNq8WcehVDwFro1rhE91e	Clinic Manager	\N	122	AG	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	GK-QA	\N	F	\N	qfmsadmin	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Delhi	\N	\N	\N	\N	\N
767	HN-QA	Potlapally Poornima	poornima.potlapally@olivaclinic.com	$2b$12$uktCwrfaHm1FGgvDRtmHeuk1XXpdJk0SdD3sNa4Evvzf4kfU7.qvi	Clinic Manager	\N	\N	PP	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	svn
768	HRBR-QA	HRBR-QA	accamma.md@olivaclinic.com	$2b$12$01yGiBI0PFP3pQ437ZZcu.vp0tFDQaoOZghqgOyxDW8k032dYO9Ke	Clinic Incharge, Clinic Manager	\N	\N	HR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HRBR-QA	Clinic Manager	mr	9741424856	AOM-BLR2	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Bengaluru	1994-03-18	2023-11-15	\N	\N	\N
769	Tejaswini	Tejaswini  Tiwari	tejaswini.tiwari@olivaclinic.com	$2b$12$INzfwyVjToDkb.gphTZsQuS/73oO4Pluh/jVxMoQ3c1PxyGfYrp2a	Area Operations Manager, Area Operations Manager Head, Employee	\N	114	TT	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Tejaswini	Clinic Incharge	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
770	HYD-ACC	Accounts Dept	accounts@olivaclinic.com	$2b$12$85hHKxkMXKeThCzAF3p5X.W6STZlsoZsLbGCkkcOa9ZloV4DYdMBW	Employee	\N	\N	AD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-ACC	Account Incharge	\N	7411003265	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	svn
771	HYD-ADMIN	Admin Dept	adminhelpdesk@olivaclinic.com	$2b$12$CgdAXzsVLMSRtDzcvesJvOfXRTpLBQuZqMW6joBapd/YrRo1BhY5m	Helpdesk In-charge	\N	\N	AD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-ADMIN	Admin Member	\N	9000370055	\N	Can View	\N	\N	\N	On-Roll	\N	\N	\N	\N	\N	\N	\N
772	HYD-AOM2	Sandhya  Innala	sandhya.inala@olivaclinic.com	$2b$12$R./JI4RCxWhtErXLRh1F2O8q7QdjMcfM13oMyTFzvvHczvpdwJdBG	Area Operations Manager	\N	\N	SI	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-AOM2	Area Operations Manager	F	\N	1010	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
773	HYD-BJH	Banjara Hills	banjarahillsteam@olivaclinic.com	$2b$12$./8pcE0DYfr0JlcKfRj/OeNoEb1LLvUbK8q.TTLO/ttzqiFJPGZ9q	Employee	\N	\N	BH	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-BJH	Clinic Incharge	\N	9000410055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	\N	\N	\N	\N
774	HYD-BPM	BPM Team	bpm@olivaclinic.com	$2b$12$OULnTF03bz2ZQqcKRcRPV.kQruj8szGp5QoJAD0rFdUpDWpeVjd7K	Employee	\N	\N	BT	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-BPM	BPM Manager	\N	9000201394	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
775	HYD-COR	MD  Assistant	sunitha@olivaclinic.com	$2b$12$2fAqlYGJ2cNOKYh9zHrAa.IMJDtGaT8gEZSje.u1xdajLOvmVmDqW	Employee	\N	\N	MA	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-COR	Administration	F	9000640055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	EMPLOYEE	Hyderabad	\N	1900-01-01	\N	\N	\N
776	HYD-DMKT	Digital Markeing	digitalmarketing@olivaclinic.com	$2b$12$2KZT1nUdFW5kLImvcn5yeOCdrCz/M1SkErKXcwZQkSGAUu6Os0XjO	Employee	\N	\N	DM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-DMKT	Digital Marketing Manager	\N	9000470055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
777	HYD-DSNR	HYD DSNR	dilsukhnagar@olivaclinic.com	$2b$12$UuOHVCqTox2T2.K1SiKVouEgtIlJ/twv3o5Cs0D.kTzCzOM1UpWCq	Clinic Incharge, Helpdesk In-charge	\N	124	HD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-DSNR	Clinic Manager	M	\N	qfmsadmin	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	New User
778	HYD-FOD	Front Desk	frontdesk@olivaclinic.com	$2b$12$B.bHcv16aNDPKB0kGYxO7ONVnODdzQBwvQL4qbYcJgmdRJ9G/6Xom	Employee, Helpdesk In-charge	\N	\N	FD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-FOD	FOE	\N	04044757500	\N	Can View and Edit	\N	\N	\N	On-Roll	\N	\N	\N	\N	\N	\N	\N
779	Syada	Syada  Maimoona	gachibowliteam@olivaclinic.com	$2b$12$NHvNxRZIHP95ftq9KNCg6uM8Mnib2TzE1KXeiRa.5sFuEHmdblmJe	Clinic Incharge, Clinic Manager	\N	\N	SM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Syada	Clinic Incharge	F	\N	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
780	HYD-HMT	Himayath Nagar	himayathnagarteam@olivaclinic.com	$2b$12$1iUruF/1ctz5GWbJJ7j5vO2ecEbkkWBvLjvmUQIryGTPJTGXYT.mS	Employee	\N	\N	HN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-HMT	Clinic Incharge	\N	7337360284	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
781	HYD-HRD	HR Dept	teamhr@olivaclinic.com	$2b$12$zhivstYWlbIxlGaoXOGWI.t/Ubh5dX3F8PwXrRmEJnxfsWeetQn1u	Employee	\N	\N	HD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-HRD	HR Manager	\N	9000310055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
782	HYD-JBH	Jubilee Hills	jubileehillsteam@olivaclinic.com	$2b$12$imImqvUVW.Id2wXNRCePFuxs8leMY2KE9Ey/shxPmuFjw0VmPVAlO	Employee	\N	125	JH	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-JBH	Clinic Incharge	\N	9000460055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
783	HYD-KKP	Kukatpally	kukatpallyteam@olivaclinic.com	$2b$12$cOLbvx9P6USt5Kc0tzbny.HPO5MpG8s8yPwK/tlrpaX8/T3AljOYC	Employee	\N	\N	KU	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-KKP	Clinic Incharge	\N	9000420055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
784	HYD-KOKAPET	Kokapet	kokapetteam@olivaclinic.com	$2b$12$5KE4mBlDpY0Kkonuq9P17.JBVL/H4pBSVuquPH4d1nLcM4PIoUMpO	Clinic Incharge, Helpdesk In-charge	\N	126	KO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-KOKAPET	Clinic Incharge	male	1234567890	AOM-BLR1	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	2025-05-12	\N	2025-06-30	\N
785	HYD-MKT	Marketing	marketing@olivaclinic.com	$2b$12$Fg8.0qsjrFh9mdhZumtexOWs3z2pw44.o6QVO1MJBaLklCYBG7IgS	Employee	\N	\N	MA	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-MKT	Marketing Manager	\N	9000430055	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
786	HYD-PRJ	Projects	projects@olivaclinic.com	$2b$12$t9IjS/hMM0A/V.ivtxXV3eJsVQTIvm4JeT44NWGKXSVFFHKQybc.e	Employee	\N	\N	PR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-PRJ	Projects Team	\N	9000260055	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
787	HYD-SEC	Secunderabad	secunderabadteam@olivaclinic.com	$2b$12$c5bCUmC7h9XFdj/Fbr9zuu/MMGepC8JSp7jZBGmg1ouIFwIIZDJoO	Employee	\N	\N	SE	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-SEC	Clinic Incharge	\N	9000520055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	\N	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
788	HYD-STR	Store	stores@olivaclinic.com	$2b$12$738jx9rpSrsM73NOYnnYuOnWyxOK7iVFWIjCmWFYdf1cNCZbogR.S	Employee, Help Desk Admin, Helpdesk In-charge	\N	\N	ST	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-STR	Stores Incharge	\N	8790555227	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
789	HYD-TRN	Training Team	trainingteam@olivaclinic.com	$2b$12$7pyURK.5TiIWQ5j53Zb/GOiEx/x0QiWAyTq.KlT84e4iuSwn8QV2i	Helpdesk In-charge	\N	\N	TT	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-TRN	Training Team Manager	\N	9000320055	\N	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
790	HYD-TRV	Travel desk	traveldesk@olivaclinic.com	$2b$12$YW0ULmhnDJOTT8AuEbmv5epVU/fqpQQ0VEcNE3HCA3iAkOh7.geNu	Employee	\N	\N	TD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	HYD-TRV	Travel Desk Incharge	\N	9000640055	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
791	IN-QA	IN-QA	ovais.wani@olivaclinic.com	$2b$12$.6mQH7aePDiO7YXI2a43ieOsm8ydpaATnjxLD.G4RXjss9zmMZBBK	Clinic Incharge, Clinic Manager	\N	\N	IN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	IN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Bengaluru	\N	1900-01-01	\N	\N	\N
792	JH-QA	JH-QA	baljinder.kaur@olivaclinic.com	$2b$12$UvpUPqHRTwRiFoqK1h0AT.UXqckIBlgitfran5wjNd2O/K5UCnTNa	Clinic Incharge, Clinic Manager	\N	125	JH	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	JH-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	\N	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
793	JP-QA	JP-QA	soma.chanda@olivaclinic.com	$2b$12$GUh00KFEXEwnNjzog1vhp.lgq42uRav/bXz/x0xcqLcVOBbGxUwRW	Clinic Incharge, Clinic Manager	\N	128	JP	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	JP-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Kolkata	\N	1900-01-01	\N	\N	\N
794	Kavitha	Kavitha Bai  M	kavitha.bai@olivaclinic.com	$2b$12$2fAte8f/pea1UoUvH7t4hOejl/RoZ3RoNlcfgj8/tK/X7HJ18h2Ei	Finance	\N	\N	KM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Kavitha	\N	F	\N	poornima	Can View and Edit	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
795	KD-QA	KD-QA	grace.nithya@olivaclinic.com	$2b$12$ZJtAchhUC64srZYaSkCgG.V.jpmmO0GRxSzH1lugXgoqdcF3MX8Cy	Clinic Incharge, Clinic Manager	\N	119	KD	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	KD-QA	Clinic Incharge	F	\N	AOM-BLR	Can View and Edit	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Cochin	\N	1900-01-01	\N	\N	\N
796	keerthi	Keerthi  Chintalapati	keerthi.chintalapati@olivaclinic.com	$2b$12$dJlO7R0qPUo7LN1UTFGUPeGdt89GX5uzORvmEIubdYmf5KN593hZa	Area Operations Manager	\N	\N	KC	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	keerthi	Area Operations Manager	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Chennai	\N	1900-01-01	\N	\N	\N
797	Keswer	Keswer  Sultana	keswer.sultana@olivaclinic.com	$2b$12$wKZLHPbmR.uFoMpKyTjgn.zD6myvj7NSiNmTw3GNNQMnUgaeDGhhC	Clinic Incharge, Clinic Manager	\N	\N	KS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Keswer	\N	F	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
798	KKP-QA	KKP-QA	naseeha.peruru@olivaclinic.com	$2b$12$IVUmkcPVdhZDtHuWhuEQDeAvRTRwglMmSfAKQe/irP9s.PUUIbJD.	Clinic Incharge, Clinic Manager	\N	\N	KK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	KKP-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
799	Nithya	Nithya  Oliva	kadavanthara@olivaclinic.com	$2b$12$qx95XR.qtdLcGAKjlqfiHefVRNRsONA5SgVh3AF4lPTP1BFOGQP5G	Clinic Incharge	\N	119	NO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Nithya	Clinic Incharge	M	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Cochin	\N	1900-01-01	\N	\N	\N
800	KM-QA	KM-QA	shweta.virmani@olivaclinic.com	$2b$12$XBKzhJIdPZTLdxjlssPlY.5R.M/vo4wETy09WCobr7NTYyWfldvj2	Clinic Manager	\N	\N	KM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	KM-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Bengaluru	\N	1900-01-01	\N	\N	\N
801	KN-QA	KN-QA	swati.deshmukh@olivaclinic.com	$2b$12$6N6Zl7cZk2DxCwzmktI2VOJNTTj3o2pVo9jURP/Y1qIjyeqMungrG	Clinic Incharge, Clinic Manager	\N	131	KN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	KN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Pune	\N	1900-01-01	\N	\N	\N
802	Kol-Park	Kolkata  park street	parkstreet@olivaclinic.com	$2b$12$jviZpXg2us5UzdVLgqVEtOFuuS5e212IoC6bqG9AEcyRSFFx4tPo6	Employee	\N	129	KS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Kol-Park	Clinic Incharge	M	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Kolkata	\N	\N	\N	\N	\N
803	Laxmi	Laxmi  Gopala Krishna	laxmi.gopalakrishna@olivaclinic.com	$2b$12$ymhUJj8HBfwVPcBqZyp8c.yhv05.v7Nqdd8dQ8M3EbMT5IHKDyM12	Clinic Incharge, Clinic Manager	\N	\N	LK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Laxmi	\N	M	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
805	Lopa	Lopa  Mudra	lopa.mudra@olivaclinic.com	$2b$12$OIV6U65YNX/Mlj9uMG6CreQofpvrdExhmXwEOUyDrnnMIFtO92f8q	Clinic Incharge, Clinic Manager	\N	133	LM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Lopa	Clinic Incharge	M	8956584562	AOM-PUN	Can View	\N	\N	\N	Off-Roll	Off-Roll	Pune	1900-01-01	2022-06-21	\N	\N	\N
806	Mahathi	Mahathi  K	mahathi.kalavai@olivaclinic.com	$2b$12$Xmw8jdX16xCZSfHgOU2E.eIMTVK49v3r1eJXcz20kLYAHRGtN4xTu	QA	\N	\N	MK	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Mahathi	\N	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Bengaluru	\N	1900-01-01	\N	\N	\N
807	navya	Navya  Shree	hrbr@olivaclinic.com	$2b$12$q2XXzWwwvWzN3D5pafSlXeFI9I4u2JNXf3N10FmAd/FDx.ogpIBfe	Clinic Incharge, Clinic Manager	\N	\N	NS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	navya	\N	M	\N	AOM-BLR2	Can View	\N	\N	\N	Off-Roll	Off-Roll	Bengaluru	1900-01-01	1900-01-01	\N	\N	\N
809	Osman	Osman Fareed   Fareed	osman.fareed@olivaclinic.com	$2b$12$e1Gbs4EDDlXDixktYWvU6e35rsnOh5jwjQkq0lij8p4Cuc6wea4C2	Finance	\N	\N	OF	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Osman	\N	M	\N	llaiah	\N	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	1995-03-24	2020-12-21	\N	\N	\N
810	Pitampuram – QA	PP-QA	suruchi.jaggi@olivaclinic.com	$2b$12$oipgVTfceGxtK/Trp74myuv/PHaStAdPg7NVrFc2raZa4DyxtH8n.	Clinic Manager	\N	123	PP	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Pitampuram – QA	Clinic Manager	Female	\N	101969	Can View	Oliva	OLIVA	OLIVA	A	Off-Roll	Delhi	\N	2023-11-20	\N	2023-11-20	\N
811	poornima	Poornima  Oliva	poornima.yeddanapalli@olivaclinic.com	$2b$12$RwIDaoYmoqzQge92sWH4DegXRAW.ZgkZ8hYeVIBHsBNr5vpQ5298.	Global Admin	\N	\N	PO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	poornima	\N	F	\N	\N	Can View and Edit	\N	\N	\N	\N	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
812	Praveen	Praveen  N	praveenkumar.n@olivaclinic.com	$2b$12$6cCFuHQ.LQC8sF835EQnNO7NHxH8ndLWBk28fTroiPOtlPeNIvKy.	Others	\N	\N	PN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Praveen	\N	M	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
813	Preet Vihar – QA	PV-QA	shilpa.singh@olivaclinic.com	$2b$12$nPyKUImv0phtmZomxGIJRusETSvH7vJZQcxZ8Olaj5pXN5cNq9YOW	Clinic Manager	\N	121	PV	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Preet Vihar – QA	Clinic Manager	Female	\N	101969	Can View	Oliva	OLIVA	OLIVA	A	Off-Roll	Delhi	\N	2023-11-20	\N	2023-11-20	\N
814	PS-QA	PS-QA	susmita.d@olivaclinic.com	$2b$12$yaIrONOeG2dXj0q364qb2eBLx9oozhIKRVRXPvD0g5rZdrajGZjuO	Clinic Manager	\N	129	PS	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	PS-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Kolkata	\N	1900-01-01	\N	\N	\N
815	Ramesh	Ramesh  Oliva	chandradhan.singh@olivaclinic.com	$2b$12$zZuorp4u31.J7sgghj7I9.rItNOLgvSUewZz7IGUXEIFBfaeoILK6	Finance	\N	\N	RO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Ramesh	\N	M	9550200055	HYD-ACC	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	1900-01-01	1900-01-01	\N	\N	\N
816	Ramya	Ramya  janagam	ramya.janagam@olivaclinic.com	$2b$12$ZXCqwsd1szFLidY0/KrrAO/3CKUYGtsslmKNhoCLfs7iueCfc7mga	MANAGER	\N	\N	RJ	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Ramya	\N	F	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
817	Sandesh	Sandesh  t	sandesh.t@olivaclinic.com	$2b$12$xzlkzScdKVWV6vFPZhV7u.NDTwCVX7NpKTphgWtRfAKpF5rrha49W	Employee, Others	\N	\N	ST	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Sandesh	Clinic Incharge	M	\N	\N	Can View	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
818	SEC-QA	SEC-QA	swapna.balne@olivaclinic.com	$2b$12$fiJgmZVlNdPi0wmI5J0otue1/1qvNbyKyPUkIMls3s5nl0QW0xKNa	Clinic Manager	\N	\N	SE	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	SEC-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Hyderabad	\N	1900-01-01	\N	\N	\N
819	SL-QA	SL-QA	mahua.sahakundu@olivaclinic.com	$2b$12$GzHT7uCBZX6Z.PZBpVo3OO5I3l5/bpmkYtjxAtiMk5SXSesMIzEte	Clinic Manager	\N	127	SL	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	SL-QA	Clinic Incharge	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	Off-Roll	Kolkata	\N	1900-01-01	\N	\N	\N
820	SN-QA	SN-QA	meena.r@olivaclinic.com	$2b$12$rrdaHr8DcjdQSS55enjgZuXW2Jl7MR0K/r7WewfEXQpNNNaLK/7US	Clinic Manager	\N	\N	SN	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	SN-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Bengaluru	\N	1900-01-01	\N	\N	\N
821	SR-QA	SR-QA	kalyani.tarwade@olivaclinic.com	$2b$12$HbyJ6XaOVvFFEwGzb8hiUu9MHKWskccS4n3Lqjh5hWw2R2JH43COe	Clinic Incharge, Clinic Manager	\N	133	SR	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	SR-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Pune	\N	1900-01-01	\N	\N	\N
822	sruthi	Sruthi  oliva	kudapa.sruthi@olivaclinic.com	$2b$12$uy2B1RMT79yiB5IiiDrVM.lWyl1X5AtH7uq4OUN2Vjyj74wf0aD1K	Clinic Incharge, Clinic Manager	\N	\N	SO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	sruthi	Clinic Incharge	F	\N	\N	Can View	Oliva	OLIVA	OLIVA	On-Roll	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
823	Swapna	Swapna  M	swapna.m@olivaclinic.com	$2b$12$.nvF9/FgFrNUoj8rqBWkJ.xQiaPNQnbx5jKwvYv3JfcxvL2mKCtQu	MANAGER	\N	\N	SM	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Swapna	\N	F	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	Off-Roll	Off-Roll	Hyderabad	\N	\N	\N	\N	\N
824	TeamQA	TeamQA	teamqa@olivaclinic.com	$2b$12$c8cHNFx.uvwAtNYivEDnJ.CWwM/ZXUoggrw53eukAHMm5CE.7q4mW	Employee	\N	\N	TE	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	TeamQA	\N	F	\N	Mahathi	\N	Oliva	OLIVA	OLIVA	A	Off-Roll	Hyderabad	\N	1900-01-01	\N	\N	\N
825	Veena	Veena  Oliva	veena.c@olivaclinic.com	$2b$12$EIwuq.fZMyr8EXKUki6Y2OU2YaxVHNP3wfWrX8j0OeJUQ6Crt4DHi	MANAGER	\N	\N	VO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Veena	\N	F	\N	poornima	Can View	\N	\N	\N	\N	Off-Roll	Hyderabad	1993-10-16	2018-05-28	\N	\N	\N
826	Vinothini	Vinothini  Oliva	vinothini.r@olivaclinic.com	$2b$12$LWGW0YZZdsqj.XL3c2nsneEItXiqOCeoAlqtrT49vR4glaZgqvFde	Clinic Incharge, Clinic Manager	\N	\N	VO	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	Vinothini	\N	M	\N	\N	Can View	\N	\N	\N	Off-Roll	Off-Roll	Chennai	\N	1900-01-01	\N	\N	\N
827	VZ-QA	VZ-QA	sagarika.mondal@olivaclinic.com	$2b$12$FvRdnc4eZFUEt0ZitN80YunOqm1ieFMhZpmCk4CaLFkFCcdWr8JDu	Clinic Manager	\N	135	VZ	Active	\N	2026-03-20 15:24:06.410631+05:30	2026-03-22 23:06:59.419164+05:30	VZ-QA	Clinic Incharge	mr	\N	\N	Can View and Edit	Oliva	OLIVA	OLIVA	A	\N	Vizag	\N	1900-01-01	\N	\N	\N
828	101074	Pallavi  Prabhakar	pallavip@olivaclinic.com	$2b$12$9aYRwuR2zizE6b/0UHU9mu0/w08oXiPWHiPMNo3CKoO1zW2a56emS	Area Operations Manager Head	\N	136	PP	Active	\N	2026-03-21 23:52:51.716108+05:30	2026-03-22 23:06:59.419164+05:30	101074		F	9000730055		Can View and Edit	Oliva	Oliva	Oliva	On-Roll	EMPLOYEE	Hyderabad					
829	102432	Neha	neha.yadav@olivaclinic.com	$2b$12$VFzyeN4B8hrN99R.My1K0OpnjK6ScNtvrvYdg6A01DdS5vXUHSYYC	Clinic Manager	49	\N	NE	Active	\N	2026-03-21 23:57:59.751177+05:30	2026-03-22 23:06:59.419164+05:30	102432	Clinic Manager	F		101969	Can View	Oliva	Oliva	Oliva				2023-09-06	2023-07-07			
830	9001	Electronic  City	electroniccityteam@olivaclinic.com	$2b$12$q3dKFdObA7LKcONAtTsoSu5aps3gzW5f52M10ox6YH0IsWZyU5TwO	Clinic Manager, Employee	49	113	EC	Active	\N	2026-03-22 00:22:37.738756+05:30	2026-03-22 23:06:59.419164+05:30	9001	Clinic Incharge	F		Tejaswini / Tejaswini  Tiwari		Oliva	Oliva	Oliva	On-Roll	Off-Roll	Bengaluru					
831	9002	OM  R	omrteam@olivaclinic.com	$2b$12$7d8ZCNu6aLqwx4xHeVM7WOWxVgfOdmi2eBb4LzcXK1WIZkifhRdDO	Employee	49	118	OR	Active	\N	2026-03-22 00:25:58.719804+05:30	2026-03-22 23:06:59.419164+05:30	9002	Clinic Incharge	F		Karthik		Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Chennai					
832	9003	Kharadi Clinic	kharaditeam@olivaclinic.com	$2b$12$oc2.yA2pquy5g5PZyuzf7eW8tCu5ZsVHIvgZIJDXu6tjE2Ug4mkEq	Employee, Clinic Incharge, Clinic Manager	49	132	KC	Active	\N	2026-03-22 00:30:48.036009+05:30	2026-03-22 23:06:59.419164+05:30	9003	Clinic Incharge	F		900001 / Sumita  Kaul	Can View and Edit	Oliva	Oliva	Oliva	On-Roll	Off-Roll	Pune	1900-01-01	1900-01-01			
833	9004	VJ A	vijayawada@olivaclinic.com	$2b$12$XL3AA2QHhaAvBH7rTRAU2.ODlop.V7stRtFsizEh3D5lVhFq6jfEO	Employee, Clinic Incharge	\N	134	VA	Active	\N	2026-03-22 00:34:58.851083+05:30	2026-03-22 23:06:59.419164+05:30	9004	Clinic Incharge	F		keerthi	Can View and Edit	Oliva	Oliva	Oliva	On-Roll	Off-Roll	Vijayawada					
834	AOM-BLR1	Triveni  Eric	triveni.eric@olivaclinic.com	$2b$12$nd4DTFa45IEN7HnkdgrLPexBDmKgCOgnJdGtpCGrnINtGB6d9DRq.	Area Operations Manager	\N	137	TE	Active	\N	2026-03-22 01:17:37.290443+05:30	2026-03-22 23:06:59.419164+05:30	AOM-BLR1	Area Operations Manager	F			Can View and Edit	Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Bengaluru					
835	AP-VZG	AP  VIZAG	vizag@olivaclinic.com	$2b$12$xNfBopqUOBJEmBd.TZJV3O5VDnwyKxHVFxSEIvs3/wTZtVjgvH4RK	Employee	\N	135	AV	Active	\N	2026-03-22 01:21:46.26016+05:30	2026-03-22 23:06:59.419164+05:30	AP-VZG	Clinic Incharge	M		HYD-AOM2 / Sandhya  Innala 	Can View	Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Vizag		1900-01-01			
836	Astha	Astha	whitefieldteam@olivaclinic.com	$2b$12$JnmmNnPL7Kz56IhjOaxSFOb38G8wtaDBE3V19GjRtDsAizD1w1yl6	Clinic Incharge, Clinic Manager	\N	115	AS	Active	\N	2026-03-22 01:24:38.463295+05:30	2026-03-22 23:06:59.419164+05:30	Astha	Clinic Incharge	M			Can View and Edit	Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Bengaluru					
837	Astha-QA	Astha  QA	astha.kapoor@olivaclinic.com	$2b$12$lrk1aKCBuGJuokusYU/YgerrwV4Stiucm7SGipOD/02PJ6RfPw2t2	Area Operations Manager	\N	137	AQ	Active	\N	2026-03-22 01:27:08.993702+05:30	2026-03-22 23:06:59.419164+05:30	Astha-QA		F			Can View and Edit	Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Bengaluru					
838	Aundh	AH-QA	nazish.ansari@olivaclinic.com	$2b$12$WFEWTs45bDDP4z/ElJuF8./oswL9G/7KWOn2TOS76FQFQbjbNP4.W	Employee	\N	138	AH	Active	\N	2026-03-22 01:31:56.976687+05:30	2026-03-22 23:06:59.419164+05:30	Aundh	Clinic Incharge			101769	Can View	Oliva	Oliva	Oliva	A		Pune				2023-12-12	
841	BLR-JNG	Jaya Nagar	jayanagarteam@olivaclinic.com	$2b$12$.j6/nc8T6KqB6.kKb5Acdephl9pwhucA8pd7JCZlRPZCol3f3i.Xi	Employee	\N	137	JN	Active	\N	2026-03-22 01:41:37.764192+05:30	2026-03-22 23:06:59.419164+05:30	BLR-JNG	Clinic Incharge		9611475266		Can View and Edit				On-Roll		Bengaluru					
842	BLR-KRM	Koramangala	koramangalateam@olivaclinic.com	$2b$12$geyNUOcjlPs5RBMFiJuE0uD9NfUQisNxL0UcOi7TPhw17wDOma9hC	Employee	\N	140	KO	Active	\N	2026-03-22 01:44:50.193264+05:30	2026-03-22 23:06:59.419164+05:30	BLR-KRM	Clinic Incharge		7022872832		Can View and Edit				On-Roll		Bengaluru					
850	CRT-SL	CRT-SL	saltlake@olivaclinic.com	$2b$12$b4Cd0bbTDenIS4ySlQJXvO85vQBn3hJt3viAygjr/pOD4BI2/Y.lW	Clinic Incharge	\N	127	CR	Active	\N	2026-03-22 22:48:12.335864+05:30	2026-03-22 23:06:59.419164+05:30	CRT-SL	Clinic Incharge	F			Can View and Edit	Oliva	Oliva	Oliva	Off-Roll	Off-Roll	Kolkata					
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 33, true);


--
-- Name: centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.centers_id_seq', 146, true);


--
-- Name: child_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.child_categories_id_seq', 622, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 52, true);


--
-- Name: designations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.designations_id_seq', 16, true);


--
-- Name: login_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.login_history_id_seq', 63, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 41, true);


--
-- Name: service_titles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_titles_id_seq', 16, true);


--
-- Name: sla_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sla_configs_id_seq', 18, true);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 512, true);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ticket_comments_id_seq', 37, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tickets_id_seq', 24, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 856, true);


--
-- Name: categories categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_code_key UNIQUE (code);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: centers centers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT centers_code_key UNIQUE (code);


--
-- Name: centers centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT centers_pkey PRIMARY KEY (id);


--
-- Name: child_categories child_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_categories
    ADD CONSTRAINT child_categories_code_key UNIQUE (code);


--
-- Name: child_categories child_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_categories
    ADD CONSTRAINT child_categories_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_code_key UNIQUE (code);


--
-- Name: designations designations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_name_key UNIQUE (name);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_titles service_titles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_titles
    ADD CONSTRAINT service_titles_code_key UNIQUE (code);


--
-- Name: service_titles service_titles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_titles
    ADD CONSTRAINT service_titles_pkey PRIMARY KEY (id);


--
-- Name: sla_configs sla_configs_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_configs
    ADD CONSTRAINT sla_configs_code_key UNIQUE (code);


--
-- Name: sla_configs sla_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_configs
    ADD CONSTRAINT sla_configs_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_code_key UNIQUE (code);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_code_key UNIQUE (code);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_categories_id ON public.categories USING btree (id);


--
-- Name: ix_centers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_centers_id ON public.centers USING btree (id);


--
-- Name: ix_child_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_child_categories_id ON public.child_categories USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_designations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_designations_id ON public.designations USING btree (id);


--
-- Name: ix_login_history_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_login_history_id ON public.login_history USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_service_titles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_service_titles_id ON public.service_titles USING btree (id);


--
-- Name: ix_sla_configs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sla_configs_id ON public.sla_configs USING btree (id);


--
-- Name: ix_subcategories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_subcategories_id ON public.subcategories USING btree (id);


--
-- Name: ix_ticket_comments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_comments_id ON public.ticket_comments USING btree (id);


--
-- Name: ix_tickets_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tickets_id ON public.tickets USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: categories categories_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: child_categories child_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_categories
    ADD CONSTRAINT child_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: child_categories child_categories_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_categories
    ADD CONSTRAINT child_categories_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: login_history login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: service_titles service_titles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_titles
    ADD CONSTRAINT service_titles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: service_titles service_titles_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_titles
    ADD CONSTRAINT service_titles_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: sla_configs sla_configs_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_configs
    ADD CONSTRAINT sla_configs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: tickets tickets_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: tickets tickets_raised_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_raised_by_id_fkey FOREIGN KEY (raised_by_id) REFERENCES public.users(id);


--
-- Name: users users_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- PostgreSQL database dump complete
--

\unrestrict QDNbl6iTvu03JkhBfFMplrQrNu7DH4UrBgvjqbsupe1SspffaZLexqADQwqQGdz

