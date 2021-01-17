-- -----------------------------------------------------------------------------
-- New
-- -----------------------------------------------------------------------------
create table recipes (
    id integer primary key,
    name text not null,
    created_on integer not null,
    latest_version integer
    );

create unique index idx_recipes_name
on recipes (name);

create table recipe_versions (
    recipe_id integer not null,
    version_id integer not null,
    data text not null,
    created_on integer not null,
    foreign key(recipe_id) references recipes(id)
    );

create unique index idx_recipe_versions_ids
on recipe_versions (recipe_id, version_id);

-- -----------------------------------------------------------------------------
-- DHT22 Schema Change
-- -----------------------------------------------------------------------------
alter table dht22_readings rename to dht22_readings_old;

create table dht22_devices (
    id integer primary key,
    alias text not null,
    pin integer,
    enabled boolean
    );

create unique index idx_dht22_devices_alias
on dht22_devices (alias);

create table dht22_readings (
    id integer not null,
    at integer not null,
    temp integer not null,
    humidity integer not null,
    foreign key(id) references dht22_devices(id)
    );

create index idx_dht22_readings_id
on dht22_readings (id);

create index idx_dht22_readings_at
on dht22_readings (at);

insert into dht22_devices(alias, pin, enabled)
select distinct which, 4, true
from dht22_readings_old;

insert into dht22_readings(at, id, temp, humidity)
select strftime('%s', "when"), id, temperature, humidity
from dht22_readings_old
inner join dht22_devices
on dht22_readings_old.which = dht22_devices.alias;

drop table dht22_readings_old;

-- -----------------------------------------------------------------------------
-- Tilt Schema Change
-- -----------------------------------------------------------------------------
alter table tilt_readings rename to tilt_readings_old;

create table tilt_readings (
    at integer not null,
    which text not null,
    temp integer not null,
    grav integer not null
    );

create index idx_tilt_readings_which
on tilt_readings (which);

create index idx_tilt_readings_at
on tilt_readings (at);

insert into tilt_readings(at, which, temp, grav)
select strftime('%s', "when"), colour, temperature, gravity
from tilt_readings_old;

drop table tilt_readings_old;

-- -----------------------------------------------------------------------------
-- Meta
-- -----------------------------------------------------------------------------
pragma user_version=2;
