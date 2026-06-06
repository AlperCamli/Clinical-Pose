// ============ NATURE — Session Review ============
import React from 'react';
import { View, Pressable } from 'react-native';
import { Screen, ScrollBody, Spread } from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Photo from '../components/Photo';
import EyeBoxEditor from '../components/EyeBoxEditor';
import { TopBar, ActionBar, Card, Tag, Btn, Sheet } from '../components/ui';
import { C, PAD } from '../theme';
import { useApp, useNav } from '../store';
import { TREATMENTS } from '../data/treatments';
import { defaultEyeBox } from '../data/eyeDefaults';
import { fmtDate, photoCaptured } from '../data/helpers';

export default function SessionReviewScreen({ route }) {
  const params = route.params || {};
  const { store, t, toast } = useApp();
  const nav = useNav();
  const c = store.clients.find((x) => x.id === params.cid);
  const cs = c.cases.find((x) => x.id === params.caseId);
  const s = cs.sessions.find((x) => x.id === params.sessionId);
  const angles = TREATMENTS[cs.treatment].angles;
  const reqd = angles.filter((a) => a.req);
  const got = reqd.filter((a) => photoCaptured(s.photos[a.id])).length;
  const complete = got >= reqd.length;
  const hasBefore = cs.sessions.some((x) => x.kind === 'before' && x.id !== s.id) || s.kind === 'after';

  // "Adjust eyes" editor (re-position the saved eye cover for any captured photo)
  const [editAid, setEditAid] = React.useState(null);
  const [editBoxes, setEditBoxes] = React.useState([]);
  const editPhoto = editAid ? s.photos[editAid] : null;
  const openEdit = (a) => {
    const p = s.photos[a.id];
    const seed = p?.eyeBoxes?.length
      ? p.eyeBoxes
      : (defaultEyeBox(a) ? [defaultEyeBox(a)] : [{ x: 0.26, y: 0.36, w: 0.48, h: 0.12, rot: 0 }]);
    setEditBoxes(seed);
    setEditAid(a.id);
  };
  const saveEdit = () => {
    store.setPhotoEyeBoxes(c.id, cs.id, s.id, editAid, editBoxes);
    setEditAid(null);
    toast('Eye position saved');
  };

  return (
    <Screen>
      <TopBar onBack={() => nav.back()} title="Session Review" sub={s.label} border />
      <ScrollBody contentStyle={{ paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 8 }}>
        <Spread style={{ marginHorizontal: 3, marginBottom: 12 }}>
          <Tag variant={s.kind === 'before' ? 'accent' : 'ok'}>{`${s.kind === 'before' ? 'BEFORE' : 'AFTER'} · ${fmtDate(s.date).toUpperCase()}`}</Tag>
          <Txt mono style={{ fontSize: 12.5, fontWeight: '600', color: complete ? C.ok : C.warn }}>{got}/{reqd.length} captured</Txt>
        </Spread>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 14 }}>
          {angles.map((a) => {
            const photo = s.photos[a.id];
            const cap = photoCaptured(photo);
            const hidden = photo?.eyeHidden ?? true;
            return (
              <Card key={a.id} style={{ width: '47.8%', flexGrow: 1, overflow: 'hidden', padding: 0 }}>
                <Pressable onPress={() => nav.go('camera', { ...params, startIdx: angles.indexOf(a) })}>
                  <Photo
                    angleCode={a.code} eyeHidden={hidden} eyeStyle={t.eyeStyle}
                    uri={photo?.uri} eyeBoxes={photo?.eyeBoxes} imgW={photo?.imgW} imgH={photo?.imgH}
                    fileMissing={photo?.fileMissing}
                    variant={(cap || photo?.fileMissing) ? 'plain' : 'empty'} style={{ height: 128, borderRadius: 0, borderWidth: 0 }}
                    overlayLabel={!cap && !photo?.fileMissing ? (
                      <>
                        <Icon name="camera" size={20} color={C.ink3} />
                        <Txt mono style={{ fontSize: 10, color: C.ink3 }}>{a.req ? 'TAP TO CAPTURE' : 'OPTIONAL'}</Txt>
                      </>
                    ) : null}
                  />
                </Pressable>
                <Spread style={{ paddingVertical: 9, paddingHorizontal: 11 }}>
                  <Txt style={{ fontSize: 12.5, fontWeight: '600' }}>{a.name}</Txt>
                  {cap || photo?.fileMissing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      {cap && (
                        <>
                          <Pressable onPress={() => openEdit(a)} hitSlop={10}>
                            <Icon name="align" size={16} color={C.ink3} />
                          </Pressable>
                          <Pressable onPress={() => store.setPhotoEyeHidden(c.id, cs.id, s.id, a.id, !hidden)} hitSlop={10}>
                            <Icon name={hidden ? 'eyeoff' : 'eye'} size={17} color={hidden ? C.accentInk : C.ink3} />
                          </Pressable>
                        </>
                      )}
                      {photo?.fileMissing && <Tag variant="warn" style={{ paddingVertical: 2, paddingHorizontal: 6 }}>FILE</Tag>}
                    </View>
                  ) : (a.req ? <Tag variant="warn" style={{ paddingVertical: 2, paddingHorizontal: 6 }}>!</Tag> : <Tag style={{ paddingVertical: 2, paddingHorizontal: 6 }}>OPT</Tag>)}
                </Spread>
              </Card>
            );
          })}
        </View>
        <View style={{ marginHorizontal: 3, flexDirection: 'row', gap: 7 }}>
          <Icon name="shield" size={14} color={C.ink3} style={{ marginTop: 1 }} />
          <Txt style={{ flex: 1, fontSize: 12.5, color: C.ink3 }}>Originals are stored untouched. Eye-hidden display versions are generated separately for sharing.</Txt>
        </View>
      </ScrollBody>
      <ActionBar>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {hasBefore && <Btn variant="soft" icon="slider" iconSize={18} label="Compare" onPress={() => nav.go('compare', { cid: c.id, caseId: cs.id })} style={{ flex: 1 }} />}
          <Btn variant="primary" icon="check" iconSize={18} label="Save session" onPress={() => {
            toast('Session saved');
            // Land on the Timeline hub with a clean back chain (→ client → home),
            // regardless of whether we came via the capture wizard or the timeline.
            nav.reset([
              { name: 'home' },
              { name: 'clientProfile', params: { cid: c.id } },
              { name: 'timeline', params: { cid: c.id, caseId: cs.id } },
            ]);
          }} style={{ flex: 1.4 }} />
        </View>
      </ActionBar>

      <Sheet open={!!editAid} onClose={() => setEditAid(null)} title="Adjust eye cover">
        {editAid && (
          <View>
            <EyeBoxEditor
              uri={editPhoto?.uri} imgW={editPhoto?.imgW} imgH={editPhoto?.imgH}
              boxes={editBoxes} eyeStyle={t.eyeStyle} onChange={setEditBoxes}
              style={{ width: '100%', height: 300, borderRadius: 16, backgroundColor: '#e7ecf2', marginBottom: 10 }}
            />
            <Txt style={{ textAlign: 'center', color: C.ink3, fontSize: 12, marginBottom: 14 }}>
              Drag to move · handles to resize · two fingers to rotate · ＋ add a block
            </Txt>
            <Btn variant="primary" icon="check" iconSize={18} label="Save eye position" onPress={saveEdit} />
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
