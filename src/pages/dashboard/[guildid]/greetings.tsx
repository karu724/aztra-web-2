import React, { useEffect, useState } from 'react';
import {
  Button,
  Row,
  Col,
  Form,
  Spinner,
  Container,
  Card,
  Alert,
  Modal,
  Table,
} from 'react-bootstrap';
import TextareaAutosize from 'react-textarea-autosize';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Code as CodeIcon, Warning as WarningIcon } from '@mui/icons-material';

import axios, { AxiosError } from 'axios';

import { Greetings as GreetingsType } from 'types/dbtypes';
import api from 'datas/api';
import { ChannelMinimal } from 'types/DiscordTypes';
import ChannelSelectCard from 'components/forms/ChannelSelectCard';
import { GetServerSideProps, NextPage } from 'next';

import Cookies from 'universal-cookie';
import Layout from 'components/Layout';
import DashboardLayout from 'components/DashboardLayout';
import useSWR from 'swr';
import urljoin from 'url-join';
import Head from 'next/head';
import filterChannels from 'utils/filterChannels';
import ChangesNotSaved from 'components/ChangesNotSaved';
import Router from 'next/router';

interface GreetingsRouterProps {
  guildId: string;
}

type handleFieldChangeTypes =
  | 'incomingTitle'
  | 'incomingDesc'
  | 'outgoingTitle'
  | 'outgoingDesc'
  | 'channel';

export const getServerSideProps: GetServerSideProps<
  GreetingsRouterProps
> = async (context) => {
  const { guildid } = context.query;
  return {
    props: {
      guildId: guildid as string,
    },
  };
};

const Greetings: NextPage<GreetingsRouterProps> = ({ guildId }) => {
  const [useJoin, setUseJoin] = useState(false);
  const [useLeave, setUseLeave] = useState(false);

  const [validIT, setValidIT] = useState<boolean | null>(null);
  const [validID, setValidID] = useState<boolean | null>(null);
  const [validOT, setValidOT] = useState<boolean | null>(null);
  const [validOD, setValidOD] = useState<boolean | null>(null);
  const [validChannel, setValidChannel] = useState<boolean | null>(null);

  const [channelSearch, setChannelSearch] = useState('');
  const [newChannel, setNewChannel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [showFormattings, setShowFormattings] = useState(false);

  const [preload, setPreload] = useState(true);
  const [changed, setChanged] = useState(false);

  const initData = (data: GreetingsType) => {
    setUseJoin(!!(data.join_title_format || data.join_desc_format));
    setUseLeave(!!(data.leave_title_format || data.leave_desc_format));
    setIncomingTitle(data.join_title_format ?? null);
    setIncomingDesc(data.join_desc_format ?? null);
    setOutgoingTitle(data.leave_title_format ?? null);
    setOutgoingDesc(data.leave_desc_format ?? null);
  };

  const { data, mutate } = useSWR<GreetingsType, AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/servers/${guildId}/greetings`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data),
    {
      onSuccess: initData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const [incomingTitle, setIncomingTitle] = useState<string | null>(null);
  const [incomingDesc, setIncomingDesc] = useState<string | null>(null);
  const [outgoingTitle, setOutgoingTitle] = useState<string | null>(null);
  const [outgoingDesc, setOutgoingDesc] = useState<string | null>(null);

  const { data: channels } = useSWR<ChannelMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN')
      ? urljoin(api, `/discord/guilds/${guildId}/channels`)
      : null,
    (url) =>
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
          },
        })
        .then((r) => r.data)
  );

  useEffect(() => {
    if (data && channels) {
      setTimeout(() => setPreload(false), 1000);
    }
  }, [data, channels]);

  useEffect(() => {
    if (!new Cookies().get('ACCESS_TOKEN')) {
      const lct = window.location;
      localStorage.setItem('loginFrom', lct.pathname + lct.search);
      window.location.assign('/login');
    }

    if (data) initData(data);
  }, [data]);

  useEffect(() => {
    const message = '???????????? ?????? ??????????????? ????????????. ?????????????????????????';

    const routeChangeStart = (url: string) => {
      if (Router.asPath !== url && changed && !confirm(message)) {
        Router.events.emit('routeChangeError');
        Router.replace(Router, Router.asPath);
        throw 'Abort route change. Please ignore this error.';
      }
    };

    const beforeunload = (e: BeforeUnloadEvent) => {
      if (changed) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', beforeunload);
    Router.events.on('routeChangeStart', routeChangeStart);

    return () => {
      window.removeEventListener('beforeunload', beforeunload);
      Router.events.off('routeChangeStart', routeChangeStart);
    };
  }, [changed]);

  const setValidate = (
    type?: handleFieldChangeTypes,
    datas?: {
      incomingTitle?: string | null;
      incomingDesc?: string | null;
      outgoingTitle?: string | null;
      outgoingDesc?: string | null;
    }
  ) => {
    const fIncomingTitle = datas?.incomingTitle ?? incomingTitle ?? '';
    const fIncomingDesc = datas?.incomingDesc ?? incomingDesc ?? '';
    const fOutgoingTitle = datas?.outgoingTitle ?? outgoingTitle ?? '';
    const fOutgoingDesc = datas?.outgoingDesc ?? outgoingDesc ?? '';

    const All = [
      0 < fIncomingTitle.length && fIncomingTitle.length <= 256
        ? null
        : useJoin
        ? false
        : null,
      0 < fOutgoingTitle.length && fOutgoingTitle.length <= 256
        ? null
        : useLeave
        ? false
        : null,
      0 < fIncomingDesc.length && fIncomingDesc.length <= 2048
        ? null
        : useJoin
        ? false
        : null,
      0 < fOutgoingDesc.length && fOutgoingDesc.length <= 2048
        ? null
        : useLeave
        ? false
        : null,
      useJoin || useLeave
        ? !!data?.channel || !!newChannel
          ? null
          : false
        : null,
    ];
    const [IT, OT, ID, OD, CH] = All;

    switch (type) {
      case 'incomingTitle':
        setValidIT(IT);
        break;
      case 'outgoingTitle':
        setValidOT(OT);
        break;
      case 'incomingDesc':
        setValidID(ID);
        break;
      case 'outgoingDesc':
        setValidOD(OD);
        break;
      case 'channel':
        setValidChannel(CH);
        break;
      default:
        for (let x of [
          'incomingTitle',
          'incomingDesc',
          'outgoingTitle',
          'outgoingDesc',
          'channel',
        ]) {
          setValidate(x as handleFieldChangeTypes);
        }
    }
    return All;
  };

  const checkValidate = () => {
    return setValidate()?.every((o) => o === null) ?? false;
  };

  const save = async () => {
    console.log(data?.channel, newChannel);
    setSaving(true);
    let saveData: GreetingsType = {
      guild: guildId,
      channel: newChannel ?? data?.channel!,
      join_title_format: useJoin ? incomingTitle ?? '' : '',
      join_desc_format: useJoin ? incomingDesc ?? '' : '',
      leave_title_format: useLeave ? outgoingTitle ?? '' : '',
      leave_desc_format: useLeave ? outgoingDesc ?? '' : '',
    };

    try {
      await axios.post(`${api}/servers/${guildId}/greetings`, saveData, {
        headers: {
          Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`,
        },
      });
      mutate(saveData);
    } catch (e) {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (checkValidate()) {
      save();
    }
  };

  const isChanged = () => {
    if (!data || !channels) {
      setChanged(false);
      return false;
    }

    const rst =
      (data.channel !== newChannel && newChannel !== null) ||
      ((data.join_title_format || '') !== (incomingTitle ?? '') && useJoin) ||
      ((data.join_desc_format || '') !== (incomingDesc ?? '') && useJoin) ||
      ((data.leave_title_format || '') !== (outgoingTitle ?? '') && useLeave) ||
      ((data.leave_desc_format || '') !== (outgoingDesc ?? '') && useLeave) ||
      (!!data.join_title_format || !!data.join_desc_format) !== useJoin ||
      (!!data.leave_title_format || !!data.leave_desc_format) !== useLeave;

    setChanged(rst);
    return rst;
  };

  const filteredChannels = filterChannels(channels ?? [], channelSearch);

  return (
    <>
      <Head>
        <title>?????? ????????? ?????? - Aztra ????????????</title>
      </Head>
      <Layout>
        <DashboardLayout guildId={guildId}>
          {() =>
            data && channels ? (
              <div>
                <Row className="dashboard-section">
                  <div>
                    <h3>?????? ?????????</h3>
                    <div className="py-2">
                      ????????? ????????? ??????????????? ?????? ??? ???????????? ?????? ????????? ??????
                      ???????????? ????????????.
                    </div>
                  </div>
                </Row>

                <Modal
                  className="modal-dark"
                  show={showFormattings}
                  onHide={() => setShowFormattings(false)}
                  centered
                  size="lg"
                >
                  <Modal.Header closeButton>
                    <Modal.Title
                      style={{
                        fontFamily: 'NanumSquare',
                        fontWeight: 900,
                      }}
                    >
                      ???????????? ??????
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="py-4">
                    <Table variant="dark" responsive="xl">
                      <thead>
                        <tr>
                          <th>??????</th>
                          <th style={{ minWidth: 120 }}>??????</th>
                          <th>??????</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['username', '?????? ????????? ??????', 'Aztra'],
                          ['usertag', '?????? ????????? ??????', '2412'],
                          ['userid', '?????? ????????? ID', '751339721782722570'],
                          ['guild', '????????? ??????', "Arpa's Server"],
                          ['membercount', '????????? ?????? ???', '904'],
                          ['usermention', '????????? ??????', '@Aztra'],
                        ].map(([c, d, e]) => (
                          <tr key={c as string}>
                            <td>${`{${c}}`}</td>
                            <td>{d}</td>
                            <td>{e}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Modal.Body>
                  <Modal.Footer className="justify-content-end">
                    <Button
                      variant="dark"
                      onClick={() => setShowFormattings(false)}
                    >
                      ??????
                    </Button>
                  </Modal.Footer>
                </Modal>

                <Row>
                  <Col>
                    <Form noValidate>
                      <Row className="pb-2">
                        <div className="d-flex align-items-center">
                          <h4>????????? ?????????</h4>
                          <Button
                            variant="dark"
                            className="ms-auto d-flex align-items-center mb-2"
                            size="sm"
                            onClick={() => setShowFormattings(true)}
                          >
                            <CodeIcon className="me-2" fontSize="small" />
                            ???????????? ??????
                          </Button>
                        </div>
                      </Row>

                      <div className="ps-3">
                        <Form.Group controlId="incomingUse" className="mb-3">
                          <Form.Check
                            type="switch"
                            label="????????? ????????? ??????"
                            checked={useJoin}
                            onChange={() => setUseJoin(!useJoin)}
                            aria-controls="incomingForm"
                            aria-expanded={!!useJoin}
                          />
                        </Form.Group>

                        <div className={!useJoin ? 'd-none' : undefined}>
                          <Form.Group
                            controlId="incomingTitle"
                            className="mb-3"
                          >
                            <Form.Label>????????? ??????</Form.Label>
                            <Form.Control
                              className="shadow"
                              isInvalid={validIT === false}
                              as={TextareaAutosize}
                              type="text"
                              placeholder="???) ${username}???, ???????????????!"
                              value={incomingTitle ?? undefined}
                              onChange={(e) => {
                                setValidate('incomingTitle', {
                                  incomingTitle: e.target.value,
                                });
                                setIncomingTitle(e.target.value);
                              }}
                            />
                            <Form.Control.Feedback type="invalid">
                              ????????? ??? ????????? ?????? 256?????? ????????? ??? ????????????!
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group controlId="incomingDesc">
                            <Form.Label>????????? ??????</Form.Label>
                            <Form.Control
                              className="shadow"
                              isInvalid={validID === false}
                              as={TextareaAutosize}
                              type="text"
                              placeholder="???) ${guild}??? ?????? ?????? ???????????????."
                              value={incomingDesc ?? undefined}
                              onChange={(e) => {
                                setValidate('incomingDesc', {
                                  incomingDesc: e.target.value,
                                });
                                setIncomingDesc(e.target.value);
                              }}
                            />
                            <Form.Control.Feedback type="invalid">
                              ????????? ??? ????????? ?????? 2048?????? ????????? ??? ????????????!
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                      </div>

                      <Row className="pt-4 pb-2">
                        <div className="d-flex align-items-center">
                          <h4>????????? ?????????</h4>
                          <Button
                            variant="dark"
                            className="ms-auto d-flex align-items-center mb-2"
                            size="sm"
                            onClick={() => setShowFormattings(true)}
                          >
                            <CodeIcon className="me-2" fontSize="small" />
                            ???????????? ??????
                          </Button>
                        </div>
                      </Row>

                      <div className="ps-3">
                        <Form.Group controlId="outgoingUse" className="mb-3">
                          <Form.Check
                            type="switch"
                            label="????????? ????????? ??????"
                            checked={useLeave}
                            onChange={() => setUseLeave(!useLeave)}
                            aria-controls="outgoingForm"
                            aria-expanded={!!useLeave}
                          />
                        </Form.Group>

                        <div className={!useLeave ? 'd-none' : undefined}>
                          <Form.Group
                            controlId="outgoingTitle"
                            className="mb-3"
                          >
                            <Form.Label>????????? ??????</Form.Label>
                            <Form.Control
                              className="shadow"
                              isInvalid={validOT === false}
                              as={TextareaAutosize}
                              type="text"
                              placeholder="???) ${username}???, ??????????????????"
                              value={outgoingTitle ?? undefined}
                              onChange={(e) => {
                                setValidate('outgoingTitle', {
                                  outgoingTitle: e.target.value,
                                });
                                setOutgoingTitle(e.target.value);
                              }}
                            />
                            <Form.Control.Feedback type="invalid">
                              ????????? ??? ????????? ?????? 256?????? ????????? ??? ????????????!
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group controlId="outgoingDesc">
                            <Form.Label>????????? ??????</Form.Label>
                            <Form.Control
                              className="shadow"
                              isInvalid={validOD === false}
                              as={TextareaAutosize}
                              type="text"
                              placeholder="???) ${username}?????? ???????????????."
                              value={outgoingDesc ?? undefined}
                              onChange={(e) => {
                                setValidate('outgoingDesc', {
                                  outgoingDesc: e.target.value,
                                });
                                setOutgoingDesc(e.target.value);
                              }}
                            />
                            <Form.Control.Feedback type="invalid">
                              ????????? ??? ????????? ?????? 2048?????? ????????? ??? ????????????!
                            </Form.Control.Feedback>
                          </Form.Group>
                        </div>
                      </div>

                      <Row className="pt-4 pb-2">
                        <h4 className="pe-5">?????? ??????</h4>
                      </Row>
                      <Row>
                        <Col md={8}>
                          {useJoin || useLeave ? (
                            <Form.Group>
                              <Container fluid>
                                <Row className="mb-3 flex-column">
                                  {newChannel ||
                                  channels?.find(
                                    (one) => one.id === data?.channel
                                  ) ? (
                                    <>
                                      <h5 className="ps-0 pe-2">
                                        ?????? ?????????:{' '}
                                      </h5>
                                      <Card bg="secondary" className="px-0">
                                        <Card.Header
                                          className="py-1 px-3"
                                          style={{
                                            fontFamily: 'NanumSquare',
                                            fontSize: '13pt',
                                          }}
                                        >
                                          <FontAwesomeIcon
                                            icon={faHashtag}
                                            className="me-2 my-auto"
                                            size="sm"
                                          />
                                          {
                                            channels?.find(
                                              (one) =>
                                                one.id ===
                                                (newChannel ?? data?.channel)
                                            )?.name
                                          }
                                        </Card.Header>
                                      </Card>
                                    </>
                                  ) : (
                                    <Form.Label
                                      as="h5"
                                      className={
                                        validChannel === false
                                          ? 'text-danger fw-bold'
                                          : ''
                                      }
                                    >
                                      ????????? ????????? ????????????!
                                    </Form.Label>
                                  )}
                                </Row>
                                <Row className="pb-2">
                                  <input hidden={true} />
                                  <Form.Control
                                    type="text"
                                    placeholder="?????? ??????"
                                    onChange={(e) =>
                                      setChannelSearch(e.target.value)
                                    }
                                  />
                                  <Form.Text className="py-1">
                                    {filteredChannels.length}??? ?????? ??????
                                  </Form.Text>
                                </Row>
                                <Row
                                  style={{
                                    maxHeight: 220,
                                    overflow: 'auto',
                                    borderRadius: '10px',
                                    display: 'block',
                                  }}
                                >
                                  {channels ? (
                                    filteredChannels.map((one) => (
                                      <ChannelSelectCard
                                        key={one.id}
                                        selected={
                                          newChannel === one.id ||
                                          (!newChannel &&
                                            one.id === data?.channel)
                                        }
                                        channelData={{
                                          channelName: one.name,
                                          parentChannelName: channels?.find(
                                            (c) => c.id === one.parentId
                                          )?.name,
                                        }}
                                        onClick={() => setNewChannel(one.id)}
                                      />
                                    ))
                                  ) : (
                                    <h4>???????????? ???</h4>
                                  )}
                                </Row>
                              </Container>
                            </Form.Group>
                          ) : (
                            <Alert variant="warning" className="d-flex">
                              <WarningIcon
                                className="me-2"
                                htmlColor="orange"
                              />
                              ????????? ??????????????? ?????? ????????? ????????? ?????? ?????????
                              ???????????? ???????????? ?????????.
                            </Alert>
                          )}
                        </Col>
                      </Row>

                      {!saveError && isChanged() ? (
                        <ChangesNotSaved
                          key="changesNotSaved1"
                          onSave={handleSubmit}
                          onReset={() => initData(data)}
                          isSaving={saving}
                          isSaveError={saveError}
                        />
                      ) : (
                        <div style={{ opacity: preload ? 0 : 1 }}>
                          <ChangesNotSaved key="changesNotSaved2" close />
                        </div>
                      )}
                    </Form>
                  </Col>
                </Row>
              </div>
            ) : (
              <Container
                className="d-flex align-items-center justify-content-center flex-column"
                style={{
                  height: '500px',
                }}
              >
                <h3 className="pb-4">???????????? ???</h3>
                <Spinner animation="border" variant="aztra" />
              </Container>
            )
          }
        </DashboardLayout>
      </Layout>
    </>
  );
};

export default Greetings;
