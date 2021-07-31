import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios'
import api from 'datas/api'
import { Row, Container, Spinner, Card, Col, Nav, Button } from 'react-bootstrap';
import BackTo from 'components/BackTo';
import { Ticket, TicketSet, Transcript, TranscriptMinimal } from 'types/dbtypes';
import { GetServerSideProps, NextPage } from 'next';
import Layout from 'components/Layout';
import DashboardLayout from 'components/DashboardLayout';
import Cookies from 'universal-cookie';
import dayjs from 'dayjs';
import dayjsRelativeTime from 'dayjs/plugin/relativeTime'
import dayjsUTC from 'dayjs/plugin/utc'
import 'dayjs/locale/ko'
import useSWR from 'swr';
import urljoin from 'url-join';
import Head from 'next/head';
import { SaveAlt as SaveAltIcon } from '@material-ui/icons'
dayjs.locale('ko')
dayjs.extend(dayjsRelativeTime)
dayjs.extend(dayjsUTC)

interface TranscriptProps {
  guildId: string
  ticketsetId: string
  ticketId: string
}

export const getServerSideProps: GetServerSideProps<TranscriptProps> = async context => {
  const { guildid, ticketsetid, ticketid } = context.query
  return {
    props: {
      guildId: guildid as string,
      ticketsetId: ticketsetid as string,
      ticketId: ticketid as string
    }
  }
}

const Transcripts: NextPage<TranscriptProps> = ({ guildId, ticketsetId, ticketId }) => {
  const [iframeHeight, setIframeHeight] = useState<number | null>(null)
  const [iframeLoad, setIframeLoad] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null)

  const { data: tickets } = useSWR<Ticket[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN') ? urljoin(api, `/servers/${guildId}/tickets/${ticketsetId}`) : null,
    url => axios.get(url, {
      headers: {
        Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`
      }
    })
      .then(r => r.data),
    {
      refreshInterval: 5000
    }
  )

  const { data: ticketsets } = useSWR<TicketSet[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN') ? urljoin(api, `/servers/${guildId}/ticketsets`) : null,
    url => axios.get(url, {
      headers: {
        Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`
      }
    })
      .then(r => r.data),
    {
      refreshInterval: 5000
    }
  )

  const ticketset = ticketsets?.find(o => o.uuid === ticketsetId)
  const ticket = tickets?.find(o => o.uuid === ticketId)

  const { data: transcripts, mutate: mutateTranscripts } = useSWR<TranscriptMinimal[], AxiosError>(
    new Cookies().get('ACCESS_TOKEN') && ticket ? urljoin(api, `/servers/${guildId}/tickets/${ticket.uuid}/transcripts`) : null,
    url => axios.get(url, {
      headers: {
        Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`
      }
    })
      .then(r => r.data),
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      onSuccess: data => {
        !selectedTranscript && setSelectedTranscript(data[0].uuid)
      }
    }
  )

  const { data: transcript, mutate: mutateTranscript } = useSWR<Transcript, AxiosError>(
    new Cookies().get('ACCESS_TOKEN') && ticket && transcripts ? urljoin(api, `/servers/${guildId}/tickets/${ticket.uuid}/transcripts/${selectedTranscript}`) : null,
    url => axios.get(url, {
      headers: {
        Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`
      }
    })
      .then(r => r.data),
    {
      revalidateOnFocus: false,
    }
  )

  useEffect(() => {
    if (!new Cookies().get('ACCESS_TOKEN')) {
      const lct = window.location
      localStorage.setItem('loginFrom', lct.pathname + lct.search)
      window.location.assign('/login')
    }
    else {
      const message = (e: MessageEvent) => setIframeHeight(e.data.scrollHeight)
      window.addEventListener('message', message)
      return () => window.removeEventListener('message', message)
    }
  }, [])

  return (
    <>
      <Head>
        <title>세부 티켓 목록 - Aztra 대시보드</title>
      </Head>
      <Layout>
        <DashboardLayout guildId={guildId}>
          {
            () => ticket && ticketsets
              ? (
                <>
                  <Row className="dashboard-section">
                    <div>
                      <BackTo className="pl-2 mb-4" name="세부 티켓 목록" to={`/dashboard/${guildId}/tickets/${ticketsetId}/list`} />
                      <h3>대화 내역</h3>
                    </div>
                  </Row>

                  <Row className="flex-column">
                    <Card bg="dark">
                      <Card.Body className="py-2 d-flex align-items-center">
                        티켓:
                        <h5 className="mb-0 pl-2" style={{ fontFamily: "NanumSquare" }}>{ticketset?.name} # {ticketset?.ticket_number}</h5>
                      </Card.Body>
                    </Card>
                  </Row>

                  {
                    transcripts !== undefined
                      ? <>
                        <Row className="mt-4">
                          <Button className="mr-2 d-flex align-items-center" variant="aztra" size="sm" onClick={() => {
                            const file = new Blob(["\ufeff" + transcript], { type: 'data:text/html;charset=utf-8' })

                            const link = document.createElement('a')
                            link.href = URL.createObjectURL(file)
                            link.download = `ticket-transcript-${ticket?.channel}.html`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}>
                            <SaveAltIcon className="mr-1" fontSize="small" />
                            보고서 다운로드
                          </Button>
                        </Row>

                        <Row className="mt-3">
                          <Col xs={12} lg={9} className="px-0">
                            {
                              transcript &&
                              <iframe
                                scrolling="no"
                                src={`data:text/html;charset=utf-8, ${encodeURIComponent(transcript.html)}`}
                                style={{ width: '100%', height: iframeLoad ? iframeHeight ? iframeHeight + 20 : '100vh' : 0, border: 'none', overflow: 'hidden' }}
                                onLoad={() => setIframeLoad(true)}
                              />
                            }
                            {
                              !iframeLoad &&
                              <Container className="d-flex align-items-center justify-content-center flex-column">
                                <h3 className="pb-4">불러오는 중</h3>
                                <Spinner animation="border" variant="aztra" />
                              </Container>
                            }
                          </Col>
                          <Col xs={{ span: 12, order: "first" }} lg={{ span: 3, order: "last" }} className="px-0 px-lg-3">
                            <Nav className="flex-column mt-3 mt-lg-0 mb-4" variant="pills" onSelect={e => {
                              if (e === selectedTranscript) return
                              setIframeLoad(false)
                              setSelectedTranscript(e)
                            }}>
                              {
                                transcripts?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(one =>
                                  <Nav.Link
                                    key={one.uuid}
                                    eventKey={one.uuid}
                                    className={`${one.uuid === selectedTranscript ? "bg-blurple-new" : ""}`}
                                  >
                                    {new Date(one.created_at).toLocaleString()}
                                  </Nav.Link>
                                )
                              }
                            </Nav>
                          </Col>
                        </Row>
                      </>
                      : <Container fluid className="text-center" style={{ marginTop: 180 }}>
                        <h3 className="mb-4">아직 저장된 대화 내역이 없습니다!</h3>
                        <Button variant="aztra" onClick={() => {
                          axios.post(`${api}/servers/${guildId}/tickets/${ticket.uuid}/transcripts/generate`, undefined, {
                            headers: {
                              Authorization: `Bearer ${new Cookies().get('ACCESS_TOKEN')}`
                            }
                          })
                            .then(r => {
                              mutateTranscripts([{ uuid: r.data.uuid, ticketid: r.data.ticketid, created_at: r.data.created_at }])
                              mutateTranscript(r.data)
                            })
                        }}>
                          새로 생성하기
                        </Button>
                      </Container>
                  }
                </>
              )
              : <Container className="d-flex align-items-center justify-content-center flex-column" style={{
                height: '500px'
              }}>
                <h3 className="pb-4">불러오는 중</h3>
                <Spinner animation="border" variant="aztra" />
              </Container>
          }
        </DashboardLayout>
      </Layout>
    </>
  )
}

export default Transcripts