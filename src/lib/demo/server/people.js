const person = (id, firstName, lastName, email) => ({
  id, email, fullName: `${firstName} ${lastName}`, firstName, lastName, profilePictureUrl: null,
});

export const ME = person("11111111-1111-4111-8111-111111111111", "Fatih", "Naz", "fatih@example.com");
export const SELIN = person("22222222-2222-4222-8222-222222222222", "Selin", "Kurt", "selin@example.com");
export const AHMET = person("33333333-3333-4333-8333-333333333333", "Ahmet", "Ünal", "ahmet@example.com");
export const EGE = person("44444444-4444-4444-8444-444444444444", "Ege", "Yıldırım", "ege@example.com");
export const DENIZ = person("55555555-5555-4555-8555-555555555555", "Deniz", "Arslan", "deniz@example.com");
export const AYSE = person("a75e0001-1111-4111-8111-000000000001", "Ayşe", "Yılmaz", "ayse.yilmaz@std.yildiz.edu.tr");

export const TEAM = [{ user: ME, role: 3 }, { user: SELIN, role: 2 }, { user: AHMET, role: 2 }];

export const PEOPLE = Object.fromEntries([ME, SELIN, AHMET, EGE, DENIZ].map((user) => [user.id, user]));

export const PERSONAS = {
  admin: { user: ME, username: "fatih", roles: ["skyforms:access", "skyforms:*"], realm: ["weblab"] },
  aday: { user: EGE, username: "ege", roles: [], realm: [] },
  ayse: { user: AYSE, username: "ayse", roles: [], realm: [] },
};

const SESSION_DAYS = 7;

const encode = (value) => btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function sessionOf(name) {
  const persona = PERSONAS[name];
  if (!persona) return null;
  const { user } = persona;
  const expires = Date.now() + SESSION_DAYS * 86400000;
  const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: user.id, exp: Math.floor(expires / 1000) })}.tanitim`;
  return {
    user: { id: user.id, name: user.fullName, email: user.email, firstName: user.firstName, lastName: user.lastName, username: persona.username, fullName: user.fullName },
    expires: new Date(expires).toISOString(),
    accessToken: token,
    skyformsRoles: persona.roles,
    realmRoles: persona.realm,
  };
}
