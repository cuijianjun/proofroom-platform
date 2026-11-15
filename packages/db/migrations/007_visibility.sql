-- Calendar-month policy belongs to the business anchor, never now-minus-months.
create function visibility_deadline(anchor timestamptz) returns timestamptz language sql stable as $$
 select ((anchor at time zone 'Asia/Shanghai')+interval '2 months') at time zone 'Asia/Shanghai'
$$;
